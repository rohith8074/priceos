# Hostaway API - Read Only Endpoints

This document outlines the exact Hostaway API endpoints you can use in Postman to pull raw, live data directly from Hostaway. This is the exact data the PriceOS application syncs.

> **Base URL:** `https://api.hostaway.com/v1`

---

## 0. Authentication (Required First Step)

Hostaway uses OAuth2 Client Credentials. You must hit this endpoint first to get a Bearer token, which you will then use in the Headers of all subsequent GET requests.

*   **Endpoint:** `https://api.hostaway.com/v1/accessTokens`
*   **Method:** `POST`
*   **Headers:** 
    *   `Content-Type: application/x-www-form-urlencoded`
    *   `Cache-control: no-cache`
*   **Body (x-www-form-urlencoded):**
    *   `grant_type`: `client_credentials`
    *   `client_id`: `your_account_id`
    *   `client_secret`: `your_client_secret`
    *   `scope`: `general`
*   **Expected Response:**
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
      "expires_in": 86400,
      "token_type": "Bearer"
    }
    ```
    *(Copy the `access_token` for the next steps!)*

---

## 1. Get All Listings (Properties)

Fetches all properties associated with your Hostaway account.

*   **Endpoint:** `https://api.hostaway.com/v1/listings`
*   **Method:** `GET`
*   **Headers:**
    *   `Authorization: Bearer YOUR_ACCESS_TOKEN`
*   **Expected Response:**
    ```json
    {
      "status": "success",
      "result": [
        {
          "id": 12345,
          "name": "Luxury Marina View Apartment",
          "city": "Dubai",
          "countryCode": "AE",
          "bedroomsNumber": 2,
          "price": 1200,
          "currencyCode": "AED"
          // ... many other hostaway fields
        }
      ]
    }
    ```

---

## 2. Get Property Calendar (Availability & Prices)

Fetches the daily calendar (availability, rates, min/max stays) for a specific property over a specified date range.

*   **Endpoint:** `https://api.hostaway.com/v1/listings/{listingId}/calendar`
*   **Method:** `GET`
*   **Headers:**
    *   `Authorization: Bearer YOUR_ACCESS_TOKEN`
*   **Query Parameters:**
    *   `startDate`: `YYYY-MM-DD` (e.g., `2026-03-01`)
    *   `endDate`: `YYYY-MM-DD` (e.g., `2026-03-31`)
*   **Example Postman URL:** `https://api.hostaway.com/v1/listings/12345/calendar?startDate=2026-03-01&endDate=2026-03-31`
*   **Expected Response:**
    ```json
    {
      "status": "success",
      "result": [
        {
          "date": "2026-03-01",
          "isAvailable": true,
          "price": 1400,
          "minimumStay": 2,
          "maximumStay": 30
        },
        {
          "date": "2026-03-02",
          "isAvailable": false,
          "price": 1400,
          "minimumStay": 2,
          "maximumStay": 30
        }
      ]
    }
    ```

---

## 3. Get All Reservations

Fetches all reservations. You can optionally filter this list down by passing query parameters.

*   **Endpoint:** `https://api.hostaway.com/v1/reservations`
*   **Method:** `GET`
*   **Headers:**
    *   `Authorization: Bearer YOUR_ACCESS_TOKEN`
*   **Optional Query Parameters:**
    *   `listingMapId`: filter to a specific listing ID
    *   `status`: filter by status (`new`, `modified`, `cancelled`)
    *   `limit`: default is typically 100
*   **Example Postman URL:** `https://api.hostaway.com/v1/reservations?listingMapId=12345`
*   **Expected Response:**
    ```json
    {
      "status": "success",
      "result": [
        {
          "id": 84920,
          "listingMapId": 12345,
          "guestName": "John Doe",
          "channelName": "airbnb",
          "arrivalDate": "2026-03-15",
          "departureDate": "2026-03-20",
          "nights": 5,
          "status": "confirmed",
          "totalPrice": 4500.00
        }
      ]
    }
    ```

> Note: Hostaway wraps all of their successful data requests inside a `"result": []` array or object. The PriceOS backend automatically unwraps this and maps it to our internal `reservations`, `listings`, and `inventory_master` databases.
