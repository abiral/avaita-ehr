# Folio EHR: design handoff for Claude Code

Live design (clickable prototype): https://claude.ai/artifact/TDhAGBd5qEXTQiB6KtZa9D

`docs/design/*.dc.html` are the design sources, one file per screen. They are design references, not production code: they run on the design tool's own runtime (`support.js`, not included). Rebuild each screen in the target stack and use these files for exact layout, copy, spacing, colors and interaction states. Each file's markup is plain HTML with inline styles; the `<script type="text/x-dc">` block at the bottom holds the sample data and the UI state logic for that screen.

All names, patients and lab values are fictional sample data. Bracketed values like `[PACKAGE PRICE]` are placeholders.

## How to use this file

This file describes what to build (screens, flows, tokens, data model). `docs/codebase.md` describes how to build the frontend and takes precedence on architecture and phases. Session prompts are in `docs/KICKOFF.md`.

## Design tokens

| Token | Value | Use |
|---|---|---|
| bg | #F4F6F9 | App background |
| surface | #FFFFFF | Cards, sidebar, top bar |
| border | #E2E6EC | Card and section borders |
| border-soft | #EDF0F4 | Row dividers |
| input-border | #D0D6DE | Inputs, secondary buttons |
| row-hover | #F7F9FB | Hover rows, subtle panels |
| table-head | #F8FAFC | Table header rows |
| ink | #101828 | Primary text |
| ink-2 | #344054 | Body text |
| ink-3 | #475467 | Secondary text |
| muted | #5D6B7E | Labels, meta text |
| accent | #1F56B4 | Primary buttons, links, active states |
| accent-hover | #174595 | Hover, accent text on soft fill |
| accent-soft | #EAF1FC | Selected rows, active nav, info banners |
| danger | #B42318 | Abnormal values, critical, destructive buttons |
| danger-soft | #FEF3F2 | Alert tags and banners |
| warn-text / warn-soft | #93370D / #FFFAEB | Safety checks, onboarding |
| neutral-tag | #EEF1F5 | Default tags |

- Fonts: IBM Plex Sans 400/500/600 (UI), IBM Plex Mono 400/500 (numbers, IDs, times, lab values; tabular figures).
- Type scale: page title 26px/600, section title 15 to 16px/600, body 14px/1.5, meta 12 to 13px, caps label 11px/600 uppercase with 0.06em tracking.
- Radius: cards 8px, buttons and inputs 6px, tags 4px, dialogs 10px.
- Controls: buttons and inputs 40 to 44px tall; touch targets at least 44px on patient screens.
- Red is reserved for abnormal and critical clinical values and destructive actions. No other decorative color.

## Layout shells

1. **Auth shell**: centered 400 to 520px card on a dotted background (Sign in, Register, Forgot password).
2. **Patient portal shell**: white top bar with logo, nav (Home, Appointments, Lab reports, Medicines) and patient avatar; content max width 1120px.
3. **Clinician shell**: white left sidebar (logo, facility switcher, nav: Today, Patients, Schedule, Results, Medication requests, Organization) plus a top bar with patient search and user. Chart screens add a patient banner with chart tabs (Summary, Notes, Orders, Results, Medications).
4. **Admin shell**: same sidebar pattern with an Admin tag; nav groups Scheduling (Appointment blocks, Leave and blocked time), Services (Consultation packages), Organization (Facilities and access).

All shells wrap to a single column on phones: the sidebar stacks above content and wide tables scroll horizontally inside their card.

## Screens

| ID | File | Route (suggested) | What it does |
|---|---|---|---|
| P1 | Main.dc.html | /login | Sign in with Patient or Staff toggle, links to register and reset |
| P2 | Register.dc.html | /register | 3 steps: details, OTP verify, done (links existing records by hospital number) |
| P3 | Forgot.dc.html | /forgot-password | 3 steps: request link, check email, set new password |
| P4 | PtHome.dc.html | /portal | Next appointment, recent lab reports, medicines, quick actions |
| P5 | Book.dc.html | /portal/book | Search doctors by name or concern, filter by category, choose on-site or remote, date and time, confirm |
| P6 | Packages.dc.html | /portal/packages | Browse, search and filter consultation packages, view details, choose format, book |
| P7 | Appointments.dc.html | /portal/appointments | Upcoming and past, reschedule, cancel dialog with reason, undo |
| P8 | PtResults.dc.html | /portal/reports | Lab reports with range bars and the doctor's comment, PDF download |
| P9 | PtMeds.dc.html | /portal/medicines | Active medicines, supply left, refill request with progress |
| C1 | Workspace.dc.html | /staff/workspace | Pick facility and department after login |
| C2 | Dashboard.dc.html | /staff | Today: my patients, items needing attention, agenda |
| C3 | Patients.dc.html | /staff/patients | Ward census with scope tabs and filters |
| C4 | Schedule.dc.html | /staff/schedule | Day view per clinician, book on behalf of a patient |
| C5 | Chart.dc.html | /staff/patients/:id | Patient summary: alert, vitals with trends, problems, meds, results, care team |
| C6 | Note.dc.html | /staff/patients/:id/notes/new | Consultation note editor with chart inserts, plan linked to orders, sign |
| C7 | Orders.dc.html | /staff/patients/:id/orders/new | Lab order catalogue, order sets, basket, duplicate warning, sign and send |
| C8 | Results.dc.html | /staff/results | Results inbox, report review with trend chart, acknowledge, release to portal |
| C9 | Requests.dc.html | /staff/medication-requests | Refill requests queue: approve, change dose or decline, safety check |
| A1 | AdminAvail.dc.html | /admin/availability | Weekly appointment blocks per doctor (on-site, remote or both), booking rules |
| A2 | AdminLeave.dc.html | /admin/time-off | Calendar of leave, block full or part days or recurring time, impact check, notify patients |
| A3 | AdminPackages.dc.html | /admin/packages | Create and edit consultation packages with live patient preview, publish |
| A4 | Admin.dc.html | /admin/organization | Facilities, onboarding a new hospital, shared vs per-facility settings, roles |

## Core flows

1. Register, verify mobile, sign in, forgot password.
2. Patient searches or filters doctors, picks one, chooses on-site or remote, picks a slot, confirms.
3. Patient cancels an appointment; the slot is released and shows as open in the clinic schedule.
4. Patient books a consultation package; the first visit uses the doctor's availability blocks.
5. Admin sets weekly appointment blocks; only slots inside blocks are bookable.
6. Admin blocks time or leave; booked patients in that window are listed, then notified or moved to a covering doctor; the patient booking screen shows those days as "On leave".
7. Clinician writes a consultation note, places a lab order, reviews the result, acknowledges it and releases it with a comment to the patient portal.
8. Patient requests a refill; the request lands in the clinician queue with a safety check; approval sends an e-prescription and notifies the patient.

## Data model (starting point)

Every table carries `organization_id`; facility-owned rows also carry `facility_id`.

- **Organization, Facility, Department, Room**
- **User** (staff or patient login), **StaffMembership** (user, facility, role), **Role** and permissions
- **Patient** (organization-wide identity and MRN), **PatientFacilityLink**
- **Practitioner** (doctor profile: category, qualifications, languages, offers_onsite, offers_remote)
- **AvailabilityBlock** (practitioner, facility, weekday, start, end, slot_minutes, mode: onsite | remote | both, room, repeat rule, effective_from)
- **TimeOff** (practitioner, start, end, all_day, reason, patient_note, handling: notify | reassign | keep, cover_practitioner)
- **BookingRules** (facility or practitioner: max_days_ahead, min_notice, cancel_cutoff, buffer)
- **Appointment** (patient, practitioner, facility, start, end, mode, status: booked | arrived | completed | cancelled | no_show, cancel_reason, package_enrollment_id)
- **ConsultationPackage** (practitioner, name, description, format: onsite | remote | hybrid | patient_choice, validity_days, price, monthly_cap, published)
- **PackageItem** (package, type: consultation | lab | session | messaging | report, quantity, label)
- **PackageEnrollment** (patient, package, chosen_format, start, expires, remaining items)
- **Encounter, ClinicalNote** (template, sections, status: draft | signed, addenda)
- **Problem, Allergy, Vital**
- **LabOrder, LabOrderItem, LabResult** (value, unit, reference range, flag, critical, acknowledged_by, released_to_patient, patient_comment)
- **Medication, MedicationRequest** (refill: requested quantity, pickup, status, decision, decided_by)
- **AuditLog** (who viewed or changed which record, when)

Map these to FHIR resources where possible (Patient, Practitioner, Schedule, Slot, Appointment, Encounter, ServiceRequest, Observation, DiagnosticReport, MedicationRequest, AuditEvent).

## Build plan (whole system, for reference; the frontend follows the phases in docs/codebase.md section 15)

1. Tenancy (organization and facility scoping), auth, roles, audit log.
2. Auth screens and patient registration (P1 to P3).
3. Practitioners, availability blocks, time off, booking rules (A1, A2).
4. Booking, cancellation, schedule (P5, P7, C4).
5. Consultation packages (A3, P6).
6. Chart, notes, lab orders and results (C5 to C8, P8).
7. Medicines and refill requests (P9, C9).
8. Dashboards and organization admin (P4, C1 to C3, A4).
