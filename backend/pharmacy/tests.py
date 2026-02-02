from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Profile
from pharmacy.models import Medicine, Pharmacy

User = get_user_model()


class PharmacyRegistryTests(APITestCase):
    def setUp(self):
        self.pharmacy_password = "PharmacyPass123!"
        self.pharmacy_user = User.objects.create_user(
            username="pharmacy_user",
            email="pharmacy@example.com",
            password=self.pharmacy_password,
        )
        self.pharmacy_user.profile.role = Profile.ROLE_PHARMACY
        self.pharmacy_user.profile.save(update_fields=["role"])

        self.customer_password = "CustomerPass123!"
        self.customer_user = User.objects.create_user(
            username="customer_user",
            email="customer@example.com",
            password=self.customer_password,
        )
        self.customer_user.profile.role = Profile.ROLE_CUSTOMER
        self.customer_user.profile.save(update_fields=["role"])

        self.admin_password = "AdminPass123!"
        self.admin_user = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password=self.admin_password,
            is_staff=True,
        )

        self.registration_payload = {
            "name": "Main Street Pharmacy",
            "license_number": "LIC-2026-01",
            "address": "123 Main St",
            "contact_email": "contact@pharmacy.test",
            "contact_phone": "+1 555 000 1111",
            "owner_name": "Pharmacy Owner",
            "owner_email": "pharmacy@example.com",
            "owner_phone": "+1 555 000 2222",
        }

    def get_token(self, username, password):
        response = self.client.post(
            reverse("token_login"),
            {"username": username, "password": password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.data["access"]

    def test_pharmacy_registration_requires_pharmacy_role(self):
        access = self.get_token(self.customer_user.username, self.customer_password)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        response = self.client.post(
            reverse("pharmacy-list"), self.registration_payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Pharmacy.objects.count(), 0)

    def test_pharmacy_registration_sends_verification_email(self):
        access = self.get_token(self.pharmacy_user.username, self.pharmacy_password)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        response = self.client.post(
            reverse("pharmacy-list"), self.registration_payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        pharmacy = Pharmacy.objects.get()
        self.assertFalse(pharmacy.is_active)
        self.assertFalse(pharmacy.is_verified)
        self.assertIsNotNone(pharmacy.verification_sent_at)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(str(pharmacy.verification_token), mail.outbox[0].body)

    def test_pharmacy_license_unique(self):
        Pharmacy.objects.create(
            owner=self.pharmacy_user,
            name="Existing Pharmacy",
            license_number="LIC-2026-01",
            address="1 First Street",
        )
        access = self.get_token(self.pharmacy_user.username, self.pharmacy_password)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        response = self.client.post(
            reverse("pharmacy-list"), self.registration_payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("license_number", response.data)

    def test_pharmacy_verification_flow(self):
        access = self.get_token(self.pharmacy_user.username, self.pharmacy_password)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        response = self.client.post(
            reverse("pharmacy-list"), self.registration_payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        pharmacy = Pharmacy.objects.get()

        verify_response = self.client.post(
            reverse("pharmacy-verify"),
            {"token": str(pharmacy.verification_token)},
            format="json",
        )
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        pharmacy.refresh_from_db()
        self.assertTrue(pharmacy.is_verified)
        self.assertTrue(pharmacy.is_active)
        self.assertIsNotNone(pharmacy.verified_at)

    def test_admin_can_activate_and_deactivate(self):
        pharmacy = Pharmacy.objects.create(
            owner=self.pharmacy_user,
            name="Toggle Pharmacy",
            license_number="LIC-2026-02",
            address="2 Second Street",
            is_verified=True,
            is_active=True,
        )
        access = self.get_token(self.admin_user.username, self.admin_password)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        response = self.client.post(
            reverse("pharmacy-activation", args=[pharmacy.id]),
            {"is_active": False},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        pharmacy.refresh_from_db()
        self.assertFalse(pharmacy.is_active)

    def test_non_admin_cannot_activate(self):
        pharmacy = Pharmacy.objects.create(
            owner=self.pharmacy_user,
            name="Restricted Pharmacy",
            license_number="LIC-2026-06",
            address="6 Sixth Street",
            is_verified=True,
            is_active=True,
        )
        access = self.get_token(self.pharmacy_user.username, self.pharmacy_password)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        response = self.client.post(
            reverse("pharmacy-activation", args=[pharmacy.id]),
            {"is_active": False},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_owner_cannot_update_pharmacy(self):
        pharmacy = Pharmacy.objects.create(
            owner=self.pharmacy_user,
            name="Owned Pharmacy",
            license_number="LIC-2026-03",
            address="3 Third Street",
        )
        other_user = User.objects.create_user(
            username="other_pharmacy",
            email="other@example.com",
            password="OtherPass123!",
        )
        other_user.profile.role = Profile.ROLE_PHARMACY
        other_user.profile.save(update_fields=["role"])

        access = self.get_token(other_user.username, "OtherPass123!")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = self.client.patch(
            reverse("pharmacy-detail", args=[pharmacy.id]),
            {"contact_phone": "+1 555 999 8888"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_cannot_change_license_number(self):
        pharmacy = Pharmacy.objects.create(
            owner=self.pharmacy_user,
            name="Locked License Pharmacy",
            license_number="LIC-2026-07",
            address="7 Seventh Street",
        )
        access = self.get_token(self.pharmacy_user.username, self.pharmacy_password)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        response = self.client.patch(
            reverse("pharmacy-detail", args=[pharmacy.id]),
            {"license_number": "LIC-2026-99"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("license_number", response.data)

    def test_customer_sees_only_active_verified_pharmacies(self):
        Pharmacy.objects.create(
            owner=self.pharmacy_user,
            name="Verified Pharmacy",
            license_number="LIC-2026-04",
            address="4 Fourth Street",
            is_active=True,
            is_verified=True,
        )
        Pharmacy.objects.create(
            owner=self.pharmacy_user,
            name="Pending Pharmacy",
            license_number="LIC-2026-05",
            address="5 Fifth Street",
            is_active=False,
            is_verified=False,
        )
        access = self.get_token(self.customer_user.username, self.customer_password)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        response = self.client.get(reverse("pharmacy-list"), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Verified Pharmacy")
        self.assertNotIn("owner_email", response.data[0])


class PharmacyMedicineTests(APITestCase):
    def setUp(self):
        self.pharmacy_password = "PharmacyPass123!"
        self.pharmacy_user = User.objects.create_user(
            username="pharmacy_user",
            email="pharmacy@example.com",
            password=self.pharmacy_password,
        )
        self.pharmacy_user.profile.role = Profile.ROLE_PHARMACY
        self.pharmacy_user.profile.save(update_fields=["role"])

        self.pharmacy = Pharmacy.objects.create(
            owner=self.pharmacy_user,
            name="Main Street Pharmacy",
            license_number="LIC-2026-10",
            address="123 Main St",
            contact_email="contact@pharmacy.test",
            contact_phone="+1 555 000 1111",
            owner_name="Pharmacy Owner",
            owner_email="pharmacy@example.com",
            owner_phone="+1 555 000 2222",
            is_active=True,
            is_verified=True,
        )

    def get_token(self, username, password):
        response = self.client.post(
            reverse("token_login"),
            {"username": username, "password": password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.data["access"]

    def test_medicine_create_by_pharmacy(self):
        access = self.get_token(self.pharmacy_user.username, self.pharmacy_password)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        payload = {
            "pharmacy_id": self.pharmacy.id,
            "name": "Paracetamol",
            "price": "12.50",
            "stock": 100,
            "prescription_required": False,
        }
        response = self.client.post(reverse("medicine-list"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Medicine.objects.count(), 1)
        self.assertEqual(Medicine.objects.first().price, Decimal("12.50"))
