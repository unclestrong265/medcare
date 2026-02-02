from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Profile
from pharmacy.models import Medicine, Pharmacy

User = get_user_model()


class OrderTests(APITestCase):
    def setUp(self):
        self.pharmacy_password = "PharmacyPass123!"
        self.pharmacy_user = User.objects.create_user(
            username="pharmacy_owner",
            email="owner@example.com",
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

        self.pharmacy = Pharmacy.objects.create(
            owner=self.pharmacy_user,
            name="Downtown Pharmacy",
            address="456 Center Rd",
            is_active=True,
            is_verified=True,
        )
        self.medicine = Medicine.objects.create(
            pharmacy=self.pharmacy,
            name="Ibuprofen",
            price=Decimal("8.00"),
            stock=50,
            prescription_required=False,
        )

    def get_token(self, username, password):
        response = self.client.post(
            reverse("token_login"),
            {"username": username, "password": password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.data["access"]

    def test_order_create_by_customer(self):
        access = self.get_token(self.customer_user.username, self.customer_password)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        payload = {
            "pharmacy": self.pharmacy.id,
            "items": [
                {"medicine": self.medicine.id, "quantity": 2},
            ],
        }
        response = self.client.post(reverse("order-list"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["total_price"], "16.00")

    def test_unauthorized_access_denied(self):
        response = self.client.get(reverse("order-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.post(reverse("medicine-list"), {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
