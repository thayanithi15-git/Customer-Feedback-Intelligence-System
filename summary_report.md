# QuickCart Customer Feedback Intelligence Summary Report

This summary report compiles the insights generated from cleaning and enriching the QuickCart customer feedback dataset (`customer_feedback_raw.csv`).

## 📊 Executive Summary Metrics
- **Total Feedback Ingested**: 1,810 rows
- **Duplicates Removed**: 581 rows (exact raw text collisions)
- **Noise / Meaningless Rows Dropped**: 150 rows (empty, punctuation, symbols, test inputs)
- **Cleaned & Analyzed Database Entries**: 1,079 rows

---

## 📈 Overall Sentiment Breakdown
Customer feedback is highly critical, with a significant majority showing negative sentiment, highlighting critical service areas:

| Sentiment | Count | Percentage (%) |
| :--- | :---: | :---: |
| **Negative** | 632 | 58.6% |
| **Neutral** | 238 | 22.1% |
| **Positive** | 209 | 19.4% |

---

## 📂 Complaint Category Distribution (Top 5)
The cleaned feedback was mapped to strict categories. Delivery and App Bugs are the primary drivers of complaints:

1. **Delivery** (`31.3%` | 338 complaints)
   - Issues: Late orders, cold food, missing items, spilled bags, and drivers unable to locate buildings.
2. **App Bug** (`27.3%` | 295 complaints)
   - Issues: App crashes during checkout, battery drain issues after updates, login screen freezes, and address saving failures.
3. **Billing** (`17.8%` | 192 complaints)
   - Issues: Double charges on credit cards, coupons not applying (e.g. SAVE50 coupon bugs), and delayed refunds.
4. **Staff/Support** (`15.2%` | 164 complaints)
   - Issues: Rude delivery drivers, unhelpful canned support agent answers, and support not responding to emails.
5. **Other** (`8.3%` | 90 complaints)
   - Issues: Feature requests (such as adding vegan options), general app feedback, and design comments.

---

## 🗣️ Representative Customer Comments

### 1. Delivery (338 Complaints)
- **ID #1493 (Rating: 1)**: `"Items were missing from my delivery, got only half the order"`
  - *Summary*: Missing items in order
- **ID #2497 (Rating: 2)**: `"Driver could not find my building and just cancelled"`
  - *Summary*: Driver could not find my building and just cancelled
- **ID #2245 (Rating: 1)**: `"Package was left at the wrong door, I never received it"`
  - *Summary*: Package was left at the wrong door

### 2. App Bug (295 Complaints)
- **ID #2771 (Rating: 1)**: `"Cannot add address, the save button is greyed out"`
  - *Summary*: Cannot save address
- **ID #2384 (Rating: 2)**: `"The new version drains my battery so fast"`
  - *Summary*: App drains battery
- **ID #2224 (Rating: 3)**: `"App stuck on loading screen for 5 minutes then closed"`
  - *Summary*: App stuck on loading screen

### 3. Billing (192 Complaints)
- **ID #2075 (Rating: 1)**: `"Coupon SAVE50 did not apply at checkout and I paid full price"`
  - *Summary*: Coupon failed to apply
- **ID #2114 (Rating: 2)**: `"My refund still hasn't come after 10 days, this is ridiculous"`
  - *Summary*: Refund status check
- **ID #2528 (Rating: 5 | Sarcastic)**: `"Wonderful, charged me twice, exactly what I wanted today"`
  - *Summary*: Double charged for the same transaction (Sarcasm detected)

### 4. Staff/Support (164 Complaints)
- **ID #2234 (Rating: 1)**: `"Nobody from support replied to my three emails"`
  - *Summary*: Support team did not reply
- **ID #1544 (Rating: 2)**: `"Delivery person was rude and threw the bag on the floor"`
  - *Summary*: Rude delivery staff
- **ID #1312 (Rating: 2)**: `"Chat support gave me copy paste answers that did not help"`
  - *Summary*: Support agent gave unhelpful canned response
