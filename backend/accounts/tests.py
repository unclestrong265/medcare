from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Profile

User = get_user_model()


class AuthTests(APITestCase):
    def setUp(self):
        self.admin_password = "AdminPass123!"
        self.admin = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password=self.admin_password,
        )

    def get_token(self, username, password):
        response = self.client.post(
            reverse("token_login"),
            {"username": username, "password": password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.data["access"]

    def test_user_register_and_login(self):
        access = self.get_token(self.admin.username, self.admin_password)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        register_payload = {
            "username": "customer1",
            "email": "customer1@example.com",
            "password": "CustomerPass123!",
            "role": Profile.ROLE_CUSTOMER,
            "phone_number": "+1234567890",
            "address": "123 Main St",
        }
        response = self.client.post(reverse("user-list"), register_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        login_response = self.client.post(
            reverse("token_login"),
            {"username": "customer1", "password": "CustomerPass123!"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_response.data)
        self.assertIn("refresh", login_response.data)
