# ADR 0017: Signing confirmations name the patient

Status: accepted

## Context

Section 1 requires that signing an order, a note or a refill decision shows the patient name and MRN in the confirm control. The designs show single buttons ("Sign note", "Sign and send", "Approve and send").

## Decision

Those buttons open a confirmation dialog whose confirm button reads "Sign for {patient}, {MRN}" (or Approve, Prescribe, Decline for refills). When refill safety checks fired, the single confirmation becomes the second confirmation: it names every fired check as well as the patient and MRN, and the decision carries the acknowledged check ids. The mock server refuses an approval whose fired checks were not acknowledged (`refill_not_allowed`), so the rule does not rely on the UI alone.

## Consequences

One extra click per signature. Tests and e2e flows confirm through the dialog by its patient-specific label.
