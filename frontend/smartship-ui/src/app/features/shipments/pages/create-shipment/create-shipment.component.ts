import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ShipmentService } from '../../../../core/services/shipment.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { trimRequired } from '../../../../shared/validators/trim-required.validator';
import { phone10Digits } from '../../../../shared/validators/phone-10digits.validator';
import { pincode6Digits } from '../../../../shared/validators/pincode-6digits.validator';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';

interface WizardStep {
  id: number;
  label: string;
  sublabel: string;
  icon: string;
}

@Component({
  selector: 'app-create-shipment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-shipment.component.html',
  styleUrls: ['./create-shipment.component.scss'],
})
export class CreateShipmentComponent implements OnInit {
  private readonly fb     = inject(FormBuilder);
  private readonly api    = inject(ShipmentService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly draftStorageKey = 'smartship.createShipmentDraft.v1';
  private readonly stepStorageKey = 'smartship.createShipmentStep.v1';

  private inMemoryDraft: {
    senderAddress?: any;
    receiverAddress?: any;
    items?: any[];
  } | null = null;

  submitting = false;
  currentStep = 1;
  readonly totalSteps = 4;

  readonly steps: WizardStep[] = [
    { id: 1, label: 'Sender',   sublabel: 'Pickup info',   icon: 'person' },
    { id: 2, label: 'Receiver', sublabel: 'Delivery info', icon: 'place' },
    { id: 3, label: 'Package',  sublabel: 'Items & weight',icon: 'inventory' },
    { id: 4, label: 'Review',   sublabel: 'Confirm & book',icon: 'check' },
  ];

  /** Stepper progress line fill (0 → 100%) */
  get stepperFillPercent(): number {
    // Fill from first to last step proportionally
    return ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
  }

  readonly form = this.fb.nonNullable.group({
    senderAddress:   this.addressGroup(),
    receiverAddress: this.addressGroup(),
    items: this.fb.nonNullable.array([this.itemGroup()]),
  });

  get items(): FormArray        { return this.form.get('items') as FormArray; }
  get senderGroup()             { return this.form.get('senderAddress')!; }
  get receiverGroup()           { return this.form.get('receiverAddress')!; }

  ngOnInit(): void {
    this.restoreDraftFromSession();

    // Keep an always-up-to-date in-memory snapshot so step navigation can restore
    // values even if storage is blocked or UI rebind drops input state.
    this.inMemoryDraft = this.form.getRawValue();

    this.form.valueChanges
      .pipe(debounceTime(150), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.inMemoryDraft = this.form.getRawValue();
        this.saveDraftToSession();
      });
  }

  private addressGroup() {
    return this.fb.nonNullable.group({
      name:    ['', trimRequired],
      phone:   ['', [trimRequired, phone10Digits]],
      street:  ['', trimRequired],
      city:    ['', trimRequired],
      state:   ['', trimRequired],
      country: ['', trimRequired],
      pincode: ['', [trimRequired, pincode6Digits]],
    });
  }

  private itemGroup() {
    return this.fb.nonNullable.group({
      itemName:   ['', trimRequired],
      quantity:   [1,    [Validators.required, Validators.min(1)]],
      weight:     [1,    [Validators.required, Validators.min(0.01)]],
      weightUnit: ['kg', Validators.required],
    });
  }

  nextStep(): void {
    if (this.currentStep >= this.totalSteps) return;

    const currentInvalid =
      (this.currentStep === 1 && this.senderGroup.invalid) ||
      (this.currentStep === 2 && this.receiverGroup.invalid) ||
      (this.currentStep === 3 && this.items.invalid);

    if (currentInvalid) {
      if (this.currentStep === 1) this.senderGroup.markAllAsTouched();
      if (this.currentStep === 2) this.receiverGroup.markAllAsTouched();
      if (this.currentStep === 3) this.items.markAllAsTouched();
      return;
    }

    this.captureDraftSnapshot();

    this.currentStep++;
    this.persistCurrentStep();
    this.restoreDraftSnapshot();
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.captureDraftSnapshot();
      this.currentStep--;
      this.persistCurrentStep();
      this.restoreDraftSnapshot();
    }
  }

  goToStep(step: number): void {
    if (step <= this.currentStep) {
      this.captureDraftSnapshot();
      this.currentStep = step;
      this.persistCurrentStep();
      this.restoreDraftSnapshot();
    }
  }

  addItem(): void    { this.items.push(this.itemGroup()); }
  removeItem(i: number): void { this.items.removeAt(i); }

  private buildCreateRequest(): any {
    const raw = this.form.getRawValue();
    return {
      senderAddress: {
        ...raw.senderAddress,
        name: raw.senderAddress.name.trim(),
        phone: raw.senderAddress.phone.trim(),
        street: raw.senderAddress.street.trim(),
        city: raw.senderAddress.city.trim(),
        state: raw.senderAddress.state.trim(),
        country: raw.senderAddress.country.trim(),
        pincode: raw.senderAddress.pincode.trim(),
      },
      receiverAddress: {
        ...raw.receiverAddress,
        name: raw.receiverAddress.name.trim(),
        phone: raw.receiverAddress.phone.trim(),
        street: raw.receiverAddress.street.trim(),
        city: raw.receiverAddress.city.trim(),
        state: raw.receiverAddress.state.trim(),
        country: raw.receiverAddress.country.trim(),
        pincode: raw.receiverAddress.pincode.trim(),
      },
      items: raw.items.map((i) => ({
        itemName: i.itemName.trim(),
        quantity: i.quantity,
        weight: i.weightUnit === 'g' ? i.weight / 1000 : i.weight,
      })),
    };
  }

  onSaveDraft(): void {
    if (this.form.invalid || this.submitting) return;

    // Ensure draft is captured even if user clicks quickly.
    this.captureDraftSnapshot();

    const request = this.buildCreateRequest();
    this.submitting = true;

    this.api.createShipment(request).subscribe({
      next: (shipment) => {
        this.clearDraftFromSession();
        this.notify.success('Draft saved successfully!');
        void this.router.navigate(['/shipments', shipment.shipmentId]);
      },
      error: () => {
        this.notify.error('Failed to save draft. Please try again.');
        this.submitting = false;
      },
      complete: () => {
        this.submitting = false;
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting) return;

    // Ensure draft is captured even if user clicks quickly.
    this.captureDraftSnapshot();

    const request = this.buildCreateRequest();

    this.submitting = true;
    this.api.createShipment(request).subscribe({
      next: (shipment) => {
        this.clearDraftFromSession();
        this.api.bookShipment(shipment.shipmentId).subscribe({
          next: () => {
            this.notify.success('Shipment booked successfully!');
            void this.router.navigate(['/shipments', shipment.shipmentId]);
          },
          error: () => {
            this.notify.error('Shipment created but booking failed. You can book it from the details page.');
            void this.router.navigate(['/shipments', shipment.shipmentId]);
          },
          complete: () => {
            this.submitting = false;
          },
        });
      },
      error: () => {
        this.notify.error('Failed to create shipment. Please try again.');
        this.submitting = false;
      },
      complete: () => {
        // Note: booking sets submitting=false.
      },
    });
  }

  private persistCurrentStep(): void {
    try {
      sessionStorage.setItem(this.stepStorageKey, String(this.currentStep));
    } catch {
      // Ignore storage errors (private mode / blocked storage)
    }
  }

  private saveDraftToSession(): void {
    try {
      const raw = this.form.getRawValue();
      sessionStorage.setItem(this.draftStorageKey, JSON.stringify(raw));
      this.persistCurrentStep();
    } catch {
      // Ignore storage errors (quota / blocked storage)
    }
  }

  private captureDraftSnapshot(): void {
    // Capture immediately (no debounce) before changing steps.
    this.inMemoryDraft = this.form.getRawValue();
    this.saveDraftToSession();
  }

  private restoreDraftSnapshot(): void {
    // Prefer in-memory snapshot (most recent), fall back to sessionStorage.
    if (this.inMemoryDraft) {
      this.applyDraft(this.inMemoryDraft);
      return;
    }

    try {
      const json = sessionStorage.getItem(this.draftStorageKey);
      if (!json) return;
      const draft = JSON.parse(json);
      this.applyDraft(draft);
    } catch {
      // Ignore
    }
  }

  private applyDraft(draft: { senderAddress?: any; receiverAddress?: any; items?: any[] }): void {
    if (draft?.senderAddress) {
      this.senderGroup.patchValue(draft.senderAddress, { emitEvent: false });
    }

    if (draft?.receiverAddress) {
      this.receiverGroup.patchValue(draft.receiverAddress, { emitEvent: false });
    }

    if (Array.isArray(draft?.items) && draft.items.length) {
      while (this.items.length) this.items.removeAt(0);
      for (const item of draft.items) {
        const group = this.itemGroup();
        group.patchValue(item ?? {}, { emitEvent: false });
        this.items.push(group);
      }
    }
  }

  private restoreDraftFromSession(): void {
    // Restore step first (so UI matches restored data)
    try {
      const stepStr = sessionStorage.getItem(this.stepStorageKey);
      const step = stepStr ? Number(stepStr) : NaN;
      if (!Number.isNaN(step)) {
        this.currentStep = Math.min(this.totalSteps, Math.max(1, Math.trunc(step)));
      }
    } catch {
      // Ignore
    }

    try {
      const json = sessionStorage.getItem(this.draftStorageKey);
      if (!json) return;

      const draft = JSON.parse(json) as { senderAddress?: any; receiverAddress?: any; items?: any[] };
      this.inMemoryDraft = draft;
      this.applyDraft(draft);
    } catch {
      // If parsing fails, clear bad data so the page keeps working.
      this.clearDraftFromSession();
    }
  }

  private clearDraftFromSession(): void {
    try {
      sessionStorage.removeItem(this.draftStorageKey);
      sessionStorage.removeItem(this.stepStorageKey);
    } catch {
      // Ignore
    }
  }
}
