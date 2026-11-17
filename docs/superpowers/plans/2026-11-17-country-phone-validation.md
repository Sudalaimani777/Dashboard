# 30-Country Mobile Number Format Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement strict, data-driven national mobile number format and digit-length validation for all 30 configured countries across client-side validation, user feedback, and backend API guards to eliminate false-positive acceptance of incomplete numbers (such as 6-digit Indian numbers).

**Architecture:**
- **Validation Dataset (`countryDialCodes.ts`):** Augment each country entry in `COUNTRIES` with strict national rules (`minDigits`, `maxDigits`, `pattern: RegExp`, `formatHint: string`).
- **Validation Engine:** Update `isValidEmergencyPhone` to match the dial code, extract national digits, verify exact digit boundaries (`minDigits` / `maxDigits`), and test against country-specific regex patterns (e.g. India requires `/^[6-9]\d{9}$/`).
- **Contextual Error Messages:** Provide dynamic validation messages via `getPhoneValidationError(fullPhone)` indicating the exact expected length and prefix for the selected country (e.g., *"India (+91) phone numbers must be 10 digits starting with 6-9"*).
- **Backend API Sync (`travel.validation.ts`):** Sync the phone validation rules into the backend `isValidPhoneNumber` validator to prevent bypasses.
- **TDD Workflow:** Red test suite covering valid and invalid mobile number permutations across all 30 countries, followed by implementation and full verification.

---

### Country Validation Matrix (All 30 Countries)

| # | Code | Country | Dial Code | Digits | Pattern Rule | Example Valid Number |
| :-: | :--- | :--- | :-: | :-: | :--- | :--- |
| 1 | `IN` | India | `+91` | 10 | `/^[6-9]\d{9}$/` (Starts with 6, 7, 8, 9) | `+91 9876543210` |
| 2 | `US` | United States | `+1` | 10 | `/^[2-9]\d{2}[2-9]\d{6}$/` (NANP standard) | `+1 4155552671` |
| 3 | `CA` | Canada | `+1` | 10 | `/^[2-9]\d{2}[2-9]\d{6}$/` (NANP standard) | `+1 4165550198` |
| 4 | `GB` | United Kingdom | `+44` | 10–11 | `/^(?:7\d{9}\|[1-9]\d{9,10})$/` (Mobile starts with 7) | `+44 7911123456` |
| 5 | `SG` | Singapore | `+65` | 8 | `/^[89]\d{7}$/` (Starts with 8 or 9) | `+65 81234567` |
| 6 | `AE` | United Arab Emirates | `+971` | 9 | `/^5\d{8}$/` (Mobile starts with 5) | `+971 501234567` |
| 7 | `SA` | Saudi Arabia | `+966` | 9 | `/^5\d{8}$/` (Mobile starts with 5) | `+966 501234567` |
| 8 | `AU` | Australia | `+61` | 9 | `/^4\d{8}$/` (Mobile starts with 4) | `+61 412345678` |
| 9 | `DE` | Germany | `+49` | 10–12 | `/^1[5-7]\d{8,10}$/` (Mobile starts with 15, 16, 17) | `+49 15112345678` |
| 10 | `FR` | France | `+33` | 9 | `/^[67]\d{8}$/` (Mobile starts with 6 or 7) | `+33 612345678` |
| 11 | `JP` | Japan | `+81` | 10–11 | `/^[789]0\d{8}$/` (Mobile starts with 70, 80, 90) | `+81 9012345678` |
| 12 | `CN` | China | `+86` | 11 | `/^1[3-9]\d{9}$/` (Mobile starts with 13-19) | `+86 13800000000` |
| 13 | `HK` | Hong Kong | `+852` | 8 | `/^[4-9]\d{7}$/` (Starts with 4-9) | `+852 91234567` |
| 14 | `KR` | South Korea | `+82` | 9–11 | `/^10\d{7,8}$/` (Mobile starts with 10) | `+82 1012345678` |
| 15 | `MY` | Malaysia | `+60` | 9–10 | `/^1[0-9]\d{7,8}$/` (Mobile starts with 1) | `+60 123456789` |
| 16 | `PH` | Philippines | `+63` | 10 | `/^9\d{9}$/` (Mobile starts with 9) | `+63 9171234567` |
| 17 | `TH` | Thailand | `+66` | 9 | `/^[689]\d{8}$/` (Mobile starts with 6, 8, 9) | `+66 812345678` |
| 18 | `ID` | Indonesia | `+62` | 9–12 | `/^8\d{8,11}$/` (Mobile starts with 8) | `+62 81234567890` |
| 19 | `VN` | Vietnam | `+84` | 9 | `/^[35789]\d{8}$/` (Mobile starts with 3, 5, 7, 8, 9) | `+84 912345678` |
| 20 | `NL` | Netherlands | `+31` | 9 | `/^6\d{8}$/` (Mobile starts with 6) | `+31 612345678` |
| 21 | `CH` | Switzerland | `+41` | 9 | `/^7[5-9]\d{7}$/` (Mobile starts with 75-79) | `+41 791234567` |
| 22 | `IE` | Ireland | `+353` | 9 | `/^8[3-9]\d{7}$/` (Mobile starts with 83-89) | `+353 851234567` |
| 23 | `ES` | Spain | `+34` | 9 | `/^[67]\d{8}$/` (Mobile starts with 6 or 7) | `+34 612345678` |
| 24 | `IT` | Italy | `+39` | 9–10 | `/^3\d{8,9}$/` (Mobile starts with 3) | `+39 3123456789` |
| 25 | `SE` | Sweden | `+46` | 9 | `/^7\d{8}$/` (Mobile starts with 7) | `+46 701234567` |
| 26 | `NO` | Norway | `+47` | 8 | `/^[49]\d{7}$/` (Mobile starts with 4 or 9) | `+47 41234567` |
| 27 | `DK` | Denmark | `+45` | 8 | `/^[2-9]\d{7}$/` (Starts with 2-9) | `+45 20123456` |
| 28 | `NZ` | New Zealand | `+64` | 8–10 | `/^2\d{7,9}$/` (Mobile starts with 2) | `+64 211234567` |
| 29 | `ZA` | South Africa | `+27` | 9 | `/^[678]\d{8}$/` (Mobile starts with 6, 7, 8) | `+27 821234567` |
| 30 | `BR` | Brazil | `+55` | 10–11 | `/^[1-9]{2}9\d{8}$/` (Area code + 9 + 8 digits) | `+55 11912345678` |

---

## File Structure & Responsibilities

| File Path | Action | Responsibility |
| :--- | :--- | :--- |
| `client/src/features/travel/utils/countryDialCodes.ts` | Modify | Add `pattern` and `formatHint` to `CountryDialCode` and `COUNTRIES`. Implement strict country-aware validation in `isValidEmergencyPhone` and `getPhoneValidationError`. |
| `server/src/features/travel/travel.validation.ts` | Modify | Update backend `isValidPhoneNumber` to enforce the same country-aware length and prefix constraints. |
| `client/src/features/travel/hooks/useTravelForm.ts` | Modify | Use `getPhoneValidationError` in Zod schema refine to render specific country guidance messages. |
| `client/src/features/travel/pages/ResubmitTravelRequestPage.tsx` | Modify | Ensure resubmit schema displays specific country guidance messages on invalid phone. |
| `client/tests/country-phone-formats.test.ts` | Create | Comprehensive unit test suite covering valid, short, wrong-prefix, and dummy numbers for all 30 countries (RED then GREEN). |
| `server/tests/travel-phone-validation.test.ts` | Create | Server unit tests ensuring backend API enforces the 30-country rules. |

---

## Step-by-Step TDD Tasks

### Task 1: 30-Country Client Validation Test Suite (TDD RED)
- [ ] **Step 1.1**: Create `client/tests/country-phone-formats.test.ts`.
- [ ] **Step 1.2**: Write test cases covering:
  - India: `89401` (fail), `894019` (fail - user screenshot scenario), `1234567890` (fail - bad prefix), `9876543210` (pass).
  - US/Canada: 7 digits (fail), 10 digits with bad area code `0123456789` (fail), valid `4155552671` (pass).
  - Singapore: 6 digits (fail), valid 8 digits `81234567` (pass).
  - UK, UAE, Saudi, Australia, Germany, France, Japan, China, etc. (all remaining 27 countries).
  - Dummy/repeated digits: `0000000000`, `9999999999` (fail).
- [ ] **Step 1.3**: Run `node server/node_modules/tsx/dist/cli.mjs client/tests/country-phone-formats.test.ts` and confirm failure (RED).

---

### Task 2: Implement Country-Aware Validation Engine (GREEN)
- [ ] **Step 2.1**: Update `CountryDialCode` interface in `countryDialCodes.ts` to include `pattern?: RegExp` and `formatHint?: string`.
- [ ] **Step 2.2**: Populate `pattern` and `formatHint` for all 30 countries in `COUNTRIES`.
- [ ] **Step 2.3**: Rewrite `isValidEmergencyPhone`:
  - Split phone into country and national number.
  - Check `nationalDigits.length >= country.minDigits && nationalDigits.length <= country.maxDigits`.
  - Check `country.pattern ? country.pattern.test(nationalDigits) : true`.
  - Reject uniform dummy digits (`/^(\d)\1+$/`).
- [ ] **Step 2.4**: Implement `getPhoneValidationError(fullPhone: string): string | null`.
- [ ] **Step 2.5**: Run `country-phone-formats.test.ts` and confirm all tests pass (GREEN).

---

### Task 3: Backend API Validation Sync & Server Tests (TDD)
- [ ] **Step 3.1**: Create `server/tests/travel-phone-validation.test.ts` testing server payload validation for +91 partial numbers (e.g. `+91 894019`) and out-of-bounds international formats. Confirm failure (RED).
- [ ] **Step 3.2**: Update `server/src/features/travel/travel.validation.ts` `isValidPhoneNumber` to validate against country prefix and length boundaries.
- [ ] **Step 3.3**: Run `server/tests/travel-phone-validation.test.ts` and confirm pass (GREEN).

---

### Task 4: UI & Form Schema Message Integration
- [ ] **Step 4.1**: Update `useTravelForm.ts` and `ResubmitTravelRequestPage.tsx` Zod schemas to call `getPhoneValidationError` so the user receives dynamic feedback:
  - e.g. *"India (+91) phone numbers must be 10 digits starting with 6-9"*
- [ ] **Step 4.2**: Verify in `TravelLogisticsFields.tsx` and `PhoneInputWithCountry.tsx` that the error message renders cleanly below the input.

---

### Task 5: Full Regression Testing & Production Build
- [ ] **Step 5.1**: Run all client test suites:
  - `country-phone-formats.test.ts`
  - `country-phone.test.ts`
  - `form-blur-validation.test.ts`
  - `expense-date-boundaries.test.ts`
  - `travel-form-date-validation.test.ts`
- [ ] **Step 5.2**: Run all server test suites:
  - `travel-phone-validation.test.ts`
  - `travel-date-boundaries.test.ts`
  - `travel-state-machine.test.ts`
- [ ] **Step 5.3**: Run `npm --prefix client run build` (`tsc -b && vite build`) and verify 0 errors.
