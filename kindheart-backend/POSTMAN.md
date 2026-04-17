# KindHeart API - Postman Collection

## Quick Start Guide

### 1. Import to Postman

Create a new collection in Postman and add these requests:

### 2. Set Environment Variables

Create environment with these variables:
- `base_url`: http://localhost:5000/api
- `token`: (will be set after login)
- `user_id`: (will be set after login)
- `campaign_id`: (will be set after creating campaign)

### 3. Sample Requests

#### AUTH

**Register**
```
POST {{base_url}}/auth/register
Body (JSON):
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login** (Save token to environment)
```
POST {{base_url}}/auth/login
Body (JSON):
{
  "email": "john@example.com",
  "password": "password123"
}

Test Script:
pm.environment.set("token", pm.response.json().data.token);
```

**Get Me**
```
GET {{base_url}}/auth/me
Authorization: Bearer {{token}}
```

#### CAMPAIGNS

**Get All Campaigns**
```
GET {{base_url}}/campaigns
```

**Get Single Campaign**
```
GET {{base_url}}/campaigns/{{campaign_id}}
```

**Create Campaign** (Save campaign_id)
```
POST {{base_url}}/campaigns
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

title: Help Build School
description: We need funds to build a school
goal_amount: 1000000
category_id: [get from categories endpoint]
image: [upload file]

Test Script:
pm.environment.set("campaign_id", pm.response.json().data.id);
```

**Update Campaign**
```
PUT {{base_url}}/campaigns/{{campaign_id}}
Authorization: Bearer {{token}}
Body (JSON):
{
  "title": "Updated Campaign Title",
  "status": "ACTIVE"
}
```

**Delete Campaign**
```
DELETE {{base_url}}/campaigns/{{campaign_id}}
Authorization: Bearer {{token}}
```

#### DONATIONS

**Create Donation**
```
POST {{base_url}}/donations
Body (JSON):
{
  "campaign_id": "{{campaign_id}}",
  "amount": 5000,
  "email": "donor@example.com"
}
```

**Verify Donation**
```
GET {{base_url}}/donations/verify/KH-reference-here
```

**Get My Donations**
```
GET {{base_url}}/donations/my-donations
Authorization: Bearer {{token}}
```

#### CATEGORIES

**Get Categories**
```
GET {{base_url}}/categories
```

**Create Category** (Admin only)
```
POST {{base_url}}/categories
Authorization: Bearer {{token}}
Body (JSON):
{
  "name": "Technology"
}
```

#### ADMIN

**Get Stats**
```
GET {{base_url}}/admin/stats
```

**Get Users** (Admin only)
```
GET {{base_url}}/admin/users
Authorization: Bearer {{token}}
```

**Update User Role** (Admin only)
```
PUT {{base_url}}/admin/users/{{user_id}}/role
Authorization: Bearer {{token}}
Body (JSON):
{
  "role": "ADMIN"
}
```

### Response Examples

#### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Error message here"
}
```

#### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```
