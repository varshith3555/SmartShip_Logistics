import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ShipmentService } from '../../../../core/services/shipment.service';
import { NotificationService } from '../../../../core/services/notification.service';

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
  template: `
    <div class="wiz-page">
      <div class="wiz-card">

        <!-- ── Header ── -->
        <div class="wiz-header">
          <div class="wiz-header-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14M5 8a2 2 0 0 1 0-4h14a2 2 0 0 1 0 4M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/></svg>
            New Shipment
          </div>
          <h1 class="wiz-title">Create a Shipment</h1>
          <p class="wiz-subtitle">Complete each section to book and confirm your shipment.</p>
        </div>

        <!-- ── Custom Stepper ── -->
        <div class="stepper">
          <div class="stepper-track">
            <div
              class="stepper-line-fill"
              [style.width.%]="stepperFillPercent"
            ></div>
          </div>

          <div class="stepper-steps">
            @for (step of steps; track step.id) {
              <button
                type="button"
                class="stepper-step"
                [class.is-done]="currentStep > step.id"
                [class.is-active]="currentStep === step.id"
                [class.is-upcoming]="currentStep < step.id"
                (click)="goToStep(step.id)"
                [disabled]="currentStep < step.id"
                [attr.aria-label]="'Step ' + step.id + ': ' + step.label"
              >
                <div class="step-bubble">
                  @if (currentStep > step.id) {
                    <!-- Checkmark -->
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  } @else {
                    <span class="step-num">{{ step.id }}</span>
                  }
                </div>
                <div class="step-label-wrap">
                  <span class="step-label">{{ step.label }}</span>
                  <span class="step-sub">{{ step.sublabel }}</span>
                </div>
              </button>
            }
          </div>
        </div>

        <!-- ── Form Body ── -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()">

          <!-- Step 1: Sender -->
          @if (currentStep === 1) {
            <div class="step-body" @fadeSlide>
              <div class="step-section-header">
                <div class="ssh-icon ssh-icon--orange">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <h2 class="ssh-title">Sender Information</h2>
                  <p class="ssh-desc">Who is sending this package? Enter pickup address &amp; contact.</p>
                </div>
              </div>

              <div class="field-section" formGroupName="senderAddress">
                <div class="section-block">
                  <div class="section-block-label">Contact</div>
                  <div class="grid-2">
                    <div class="field-group">
                      <label class="field-label" for="s-name">Full Name</label>
                      <input id="s-name" type="text" class="field-input" formControlName="name" placeholder="John Doe" autocomplete="name" />
                      <span class="field-hint">Contact person for pickup</span>
                    </div>
                    <div class="field-group">
                      <label class="field-label" for="s-phone">Phone Number</label>
                      <input id="s-phone" type="tel" class="field-input" formControlName="phone" placeholder="+91 98765 43210" autocomplete="tel" />
                      <span class="field-hint">For pickup coordination</span>
                    </div>
                  </div>
                </div>

                <div class="section-block">
                  <div class="section-block-label">Address</div>
                  <div class="grid-1">
                    <div class="field-group">
                      <label class="field-label" for="s-street">Street Address</label>
                      <input id="s-street" type="text" class="field-input" formControlName="street" placeholder="123 Main Street, Apt 4B" autocomplete="street-address" />
                    </div>
                  </div>
                  <div class="grid-2 mt-fields">
                    <div class="field-group">
                      <label class="field-label" for="s-city">City</label>
                      <input id="s-city" type="text" class="field-input" formControlName="city" placeholder="Mumbai" autocomplete="address-level2" />
                    </div>
                    <div class="field-group">
                      <label class="field-label" for="s-state">State / Province</label>
                      <input id="s-state" type="text" class="field-input" formControlName="state" placeholder="Maharashtra" autocomplete="address-level1" />
                    </div>
                  </div>
                  <div class="grid-2 mt-fields">
                    <div class="field-group">
                      <label class="field-label" for="s-country">Country</label>
                      <input id="s-country" type="text" class="field-input" formControlName="country" placeholder="India" autocomplete="country-name" />
                    </div>
                    <div class="field-group">
                      <label class="field-label" for="s-pin">Postal Code</label>
                      <input id="s-pin" type="text" class="field-input" formControlName="pincode" placeholder="400001" autocomplete="postal-code" />
                    </div>
                  </div>
                </div>
              </div>

              <div class="step-actions">
                <span></span>
                <button type="button" class="btn-primary" (click)="nextStep()" [disabled]="senderGroup.invalid" id="sender-continue-btn">
                  Continue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          }

          <!-- Step 2: Receiver -->
          @if (currentStep === 2) {
            <div class="step-body" @fadeSlide>
              <div class="step-section-header">
                <div class="ssh-icon ssh-icon--blue">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <h2 class="ssh-title">Receiver Information</h2>
                  <p class="ssh-desc">Where is this package going? Enter delivery address &amp; contact.</p>
                </div>
              </div>

              <div class="field-section" formGroupName="receiverAddress">
                <div class="section-block">
                  <div class="section-block-label">Contact</div>
                  <div class="grid-2">
                    <div class="field-group">
                      <label class="field-label" for="r-name">Full Name</label>
                      <input id="r-name" type="text" class="field-input" formControlName="name" placeholder="Jane Smith" autocomplete="name" />
                      <span class="field-hint">Contact person for delivery</span>
                    </div>
                    <div class="field-group">
                      <label class="field-label" for="r-phone">Phone Number</label>
                      <input id="r-phone" type="tel" class="field-input" formControlName="phone" placeholder="+91 98765 43210" autocomplete="tel" />
                      <span class="field-hint">For delivery coordination</span>
                    </div>
                  </div>
                </div>

                <div class="section-block">
                  <div class="section-block-label">Address</div>
                  <div class="grid-1">
                    <div class="field-group">
                      <label class="field-label" for="r-street">Street Address</label>
                      <input id="r-street" type="text" class="field-input" formControlName="street" placeholder="456 Oak Avenue, Suite 200" autocomplete="street-address" />
                    </div>
                  </div>
                  <div class="grid-2 mt-fields">
                    <div class="field-group">
                      <label class="field-label" for="r-city">City</label>
                      <input id="r-city" type="text" class="field-input" formControlName="city" placeholder="Delhi" autocomplete="address-level2" />
                    </div>
                    <div class="field-group">
                      <label class="field-label" for="r-state">State / Province</label>
                      <input id="r-state" type="text" class="field-input" formControlName="state" placeholder="Delhi" autocomplete="address-level1" />
                    </div>
                  </div>
                  <div class="grid-2 mt-fields">
                    <div class="field-group">
                      <label class="field-label" for="r-country">Country</label>
                      <input id="r-country" type="text" class="field-input" formControlName="country" placeholder="India" autocomplete="country-name" />
                    </div>
                    <div class="field-group">
                      <label class="field-label" for="r-pin">Postal Code</label>
                      <input id="r-pin" type="text" class="field-input" formControlName="pincode" placeholder="110001" autocomplete="postal-code" />
                    </div>
                  </div>
                </div>
              </div>

              <div class="step-actions">
                <button type="button" class="btn-ghost" (click)="prevStep()" id="receiver-back-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Back
                </button>
                <button type="button" class="btn-primary" (click)="nextStep()" [disabled]="receiverGroup.invalid" id="receiver-continue-btn">
                  Continue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          }

          <!-- Step 3: Package -->
          @if (currentStep === 3) {
            <div class="step-body" @fadeSlide>
              <div class="step-section-header">
                <div class="ssh-icon ssh-icon--purple">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                </div>
                <div>
                  <h2 class="ssh-title">Package Details</h2>
                  <p class="ssh-desc">List all items included in this shipment.</p>
                </div>
              </div>

              <div class="field-section">
                <div formArrayName="items" class="items-list">
                  @for (item of items.controls; track $index) {
                    <div class="item-card" [formGroupName]="$index">
                      <div class="item-card-header">
                        <div class="item-pill">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                          Item {{ $index + 1 }}
                        </div>
                        @if (items.length > 1) {
                          <button type="button" class="btn-remove" (click)="removeItem($index)" [attr.aria-label]="'Remove item ' + ($index + 1)" id="remove-item-{{ $index }}-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            Remove
                          </button>
                        }
                      </div>

                      <div class="grid-1">
                        <div class="field-group">
                          <label class="field-label" [for]="'item-name-' + $index">Item Description</label>
                          <input [id]="'item-name-' + $index" type="text" class="field-input" formControlName="itemName" placeholder="e.g., Electronics, Documents, Clothing" />
                        </div>
                      </div>

                      <div class="grid-2 mt-fields">
                        <div class="field-group">
                          <label class="field-label" [for]="'item-qty-' + $index">Quantity</label>
                          <input [id]="'item-qty-' + $index" type="number" class="field-input" formControlName="quantity" min="1" placeholder="1" />
                        </div>
                        <div class="field-group">
                          <label class="field-label" [for]="'item-weight-' + $index">Weight</label>
                          <div class="input-addon-wrap">
                            <input
                              [id]="'item-weight-' + $index"
                              type="number"
                              class="field-input field-input--addon"
                              formControlName="weight"
                              step="0.01"
                              min="0.01"
                              placeholder="1.5"
                            />
                            <select class="field-addon-select" formControlName="weightUnit" [attr.aria-label]="'Weight unit for item ' + ($index + 1)">
                              <option value="kg">kg</option>
                              <option value="g">g</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </div>

                <button type="button" class="btn-add-item" (click)="addItem()" id="add-item-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Another Item
                </button>
              </div>

              <div class="step-actions">
                <button type="button" class="btn-ghost" (click)="prevStep()" id="package-back-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Back
                </button>
                <button type="button" class="btn-primary" (click)="nextStep()" [disabled]="items.invalid" id="package-review-btn">
                  Review Order
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          }

          <!-- Step 4: Review & Submit -->
          @if (currentStep === 4) {
            <div class="step-body" @fadeSlide>
              <div class="step-section-header">
                <div class="ssh-icon ssh-icon--green">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </div>
                <div>
                  <h2 class="ssh-title">Review &amp; Confirm</h2>
                  <p class="ssh-desc">Double-check every detail before booking your shipment.</p>
                </div>
              </div>

              <div class="review-grid">
                <!-- Sender summary -->
                <div class="review-card">
                  <div class="review-card-hd">
                    <div class="rc-icon rc-icon--orange">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <span class="rc-title">Sender</span>
                    <button type="button" class="rc-edit" (click)="goToStep(1)" id="edit-sender-btn">Edit</button>
                  </div>
                  <div class="rc-body">
                    <p class="rc-name">{{ form.value.senderAddress?.name }}</p>
                    <p class="rc-text">{{ form.value.senderAddress?.phone }}</p>
                    <p class="rc-text">
                      {{ form.value.senderAddress?.street }},
                      {{ form.value.senderAddress?.city }},
                      {{ form.value.senderAddress?.state }} {{ form.value.senderAddress?.pincode }},
                      {{ form.value.senderAddress?.country }}
                    </p>
                  </div>
                </div>

                <!-- Receiver summary -->
                <div class="review-card">
                  <div class="review-card-hd">
                    <div class="rc-icon rc-icon--blue">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    </div>
                    <span class="rc-title">Receiver</span>
                    <button type="button" class="rc-edit" (click)="goToStep(2)" id="edit-receiver-btn">Edit</button>
                  </div>
                  <div class="rc-body">
                    <p class="rc-name">{{ form.value.receiverAddress?.name }}</p>
                    <p class="rc-text">{{ form.value.receiverAddress?.phone }}</p>
                    <p class="rc-text">
                      {{ form.value.receiverAddress?.street }},
                      {{ form.value.receiverAddress?.city }},
                      {{ form.value.receiverAddress?.state }} {{ form.value.receiverAddress?.pincode }},
                      {{ form.value.receiverAddress?.country }}
                    </p>
                  </div>
                </div>

                <!-- Package items summary -->
                <div class="review-card review-card--full">
                  <div class="review-card-hd">
                    <div class="rc-icon rc-icon--purple">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                    </div>
                    <span class="rc-title">Package Items ({{ form.value.items?.length }})</span>
                    <button type="button" class="rc-edit" (click)="goToStep(3)" id="edit-items-btn">Edit</button>
                  </div>
                  <div class="rc-body">
                    <div class="items-review-list">
                      @for (item of form.value.items; track $index) {
                        <div class="items-review-row">
                          <div class="irr-left">
                            <span class="irr-dot"></span>
                            <span class="irr-name">{{ item?.itemName || 'Item ' + ($index + 1) }}</span>
                          </div>
                          <div class="irr-right">
                            <span class="irr-badge">Qty: {{ item?.quantity }}</span>
                            <span class="irr-badge">{{ item?.weight }} {{ item?.weightUnit }}</span>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>

              <div class="step-actions">
                <button type="button" class="btn-ghost" (click)="prevStep()" id="review-back-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Back
                </button>
                <button type="submit" class="btn-primary btn-submit" [disabled]="form.invalid || submitting" id="create-shipment-submit-btn">
                  @if (submitting) {
                    <span class="spinner"></span>
                    Creating…
                  } @else {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Confirm &amp; Book
                  }
                </button>
              </div>
            </div>
          }

        </form>
      </div>
    </div>
  `,
  styles: [`
    /* ─── Google Font import ─── */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    /* ─── Page Shell ─── */
    .wiz-page {
      min-height: 100vh;
      background: #F9FAFB;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 40px 20px 80px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* ─── Main Card ─── */
    .wiz-card {
      width: 100%;
      max-width: 820px;
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #E5E7EB;
      box-shadow:
        0 1px 3px rgba(0,0,0,0.06),
        0 8px 32px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    /* ─── Header ─── */
    .wiz-header {
      padding: 40px 40px 32px;
      border-bottom: 1px solid #F3F4F6;
      background: linear-gradient(135deg, #FFFAF8 0%, #FFFFFF 100%);
    }

    .wiz-header-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 100px;
      background: #FFF4F0;
      color: #ff6b35;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      margin-bottom: 16px;
    }

    .wiz-title {
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: #111827;
      margin: 0 0 6px;
      line-height: 1.2;
    }

    .wiz-subtitle {
      font-size: 14px;
      color: #6B7280;
      margin: 0;
      line-height: 1.5;
    }

    /* ─── Custom Stepper ─── */
    .stepper {
      position: relative;
      padding: 32px 40px 0;
    }

    /* The background rail */
    .stepper-track {
      position: absolute;
      top: 52px;           /* vertically center on the bubbles */
      left: calc(40px + 20px);   /* start from center of first bubble */
      right: calc(40px + 20px);
      height: 2px;
      background: #E5E7EB;
      border-radius: 2px;
      overflow: hidden;
    }

    /* Animated fill */
    .stepper-line-fill {
      height: 100%;
      background: linear-gradient(90deg, #ff6b35, #ff8c42);
      border-radius: 2px;
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .stepper-steps {
      display: flex;
      justify-content: space-between;
      position: relative;
      z-index: 1;
      padding-bottom: 32px;
      border-bottom: 1px solid #F3F4F6;
    }

    .stepper-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      flex: 1;
      max-width: 180px;
      transition: opacity 0.2s ease;
    }

    .stepper-step:disabled {
      cursor: default;
    }

    .stepper-step.is-upcoming {
      opacity: 0.45;
    }

    /* Bubble */
    .step-bubble {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-weight: 700;
      font-size: 14px;
      transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      border: 2px solid #E5E7EB;
      background: #fff;
      color: #9CA3AF;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .stepper-step.is-done .step-bubble {
      background: #10b981;
      border-color: #10b981;
      color: #fff;
      box-shadow: 0 0 0 4px rgba(16,185,129,0.12), 0 2px 8px rgba(16,185,129,0.3);
    }

    .stepper-step.is-active .step-bubble {
      background: linear-gradient(135deg, #ff6b35 0%, #e85a28 100%);
      border-color: #ff6b35;
      color: #fff;
      box-shadow: 0 0 0 4px rgba(255,107,53,0.15), 0 2px 12px rgba(255,107,53,0.35);
      transform: scale(1.08);
    }

    .step-num {
      font-size: 14px;
      font-weight: 700;
    }

    /* Labels */
    .step-label-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      text-align: center;
    }

    .step-label {
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      letter-spacing: -0.01em;
      transition: color 0.2s ease;
    }

    .stepper-step.is-active .step-label {
      color: #ff6b35;
    }

    .stepper-step.is-done .step-label {
      color: #10b981;
    }

    .step-sub {
      font-size: 11px;
      color: #9CA3AF;
    }

    /* ─── Step Body ─── */
    .step-body {
      padding: 36px 40px;
      animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) both;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ─── Section Header ─── */
    .step-section-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 32px;
    }

    .ssh-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }

    .ssh-icon--orange { background: #FFF4F0; color: #ff6b35; }
    .ssh-icon--blue   { background: #EFF6FF; color: #3B82F6; }
    .ssh-icon--purple { background: #F5F3FF; color: #7C3AED; }
    .ssh-icon--green  { background: #ECFDF5; color: #10B981; }

    .ssh-title {
      font-size: 1.2rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      color: #111827;
      margin: 0 0 4px;
    }

    .ssh-desc {
      font-size: 13.5px;
      color: #6B7280;
      margin: 0;
      line-height: 1.5;
    }

    /* ─── Field Section ─── */
    .field-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .section-block {
      padding: 24px;
      background: #FAFAFA;
      border: 1px solid #F3F4F6;
      border-radius: 12px;
    }

    .section-block-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #9CA3AF;
      margin-bottom: 18px;
    }

    /* ─── Grid Layouts ─── */
    .grid-1 {
      display: grid;
      grid-template-columns: 1fr;
      gap: 18px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 18px;
    }

    .mt-fields {
      margin-top: 18px;
    }

    /* ─── Field Groups ─── */
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-label {
      font-size: 12.5px;
      font-weight: 600;
      color: #374151;
      letter-spacing: -0.01em;
    }

    .field-input {
      width: 100%;
      padding: 10px 13px;
      font-size: 14px;
      font-family: inherit;
      color: #111827;
      background: #ffffff;
      border: 1.5px solid #D1D5DB;
      border-radius: 8px;
      transition:
        border-color 0.18s ease,
        box-shadow 0.18s ease,
        background 0.18s ease;
      box-sizing: border-box;
      outline: none;
    }

    .field-input::placeholder {
      color: #9CA3AF;
      font-size: 13.5px;
    }

    .field-input:hover {
      border-color: #9CA3AF;
    }

    .field-input:focus {
      border-color: #ff6b35;
      box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.14);
      background: #FFFAF8;
    }

    .field-hint {
      font-size: 11.5px;
      color: #9CA3AF;
    }

    /* ─── Input Addon (weight + unit) ─── */
    .input-addon-wrap {
      display: flex;
    }

    .field-input--addon {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      border-right: none;
      flex: 1;
    }

    .field-addon-select {
      width: 68px;
      padding: 10px 8px;
      font-size: 13px;
      font-family: inherit;
      font-weight: 600;
      color: #374151;
      background: #F9FAFB;
      border: 1.5px solid #D1D5DB;
      border-left: none;
      border-top-right-radius: 8px;
      border-bottom-right-radius: 8px;
      cursor: pointer;
      outline: none;
      transition: border-color 0.18s ease;
    }

    .field-addon-select:focus {
      border-color: #ff6b35;
    }

    /* ─── Items List ─── */
    .items-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 16px;
    }

    .item-card {
      padding: 22px 24px;
      background: #FAFAFA;
      border: 1.5px solid #F3F4F6;
      border-radius: 12px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .item-card:hover {
      border-color: #D1D5DB;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }

    .item-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }

    .item-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: #EFF6FF;
      color: #3B82F6;
      border-radius: 100px;
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    .btn-remove {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border: 1.5px solid #FEE2E2;
      border-radius: 8px;
      background: #FFF5F5;
      color: #EF4444;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-remove:hover {
      background: #FEE2E2;
      border-color: #EF4444;
    }

    .btn-add-item {
      width: 100%;
      padding: 13px 20px;
      border: 1.5px dashed #D1D5DB;
      border-radius: 10px;
      background: transparent;
      color: #6B7280;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .btn-add-item:hover {
      border-color: #ff6b35;
      color: #ff6b35;
      background: #FFF4F0;
    }

    /* ─── Review Grid ─── */
    .review-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 8px;
    }

    .review-card {
      padding: 22px 24px;
      background: #FAFAFA;
      border: 1px solid #F3F4F6;
      border-radius: 12px;
    }

    .review-card--full {
      grid-column: 1 / -1;
    }

    .review-card-hd {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      padding-bottom: 14px;
      border-bottom: 1px solid #F3F4F6;
    }

    .rc-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }

    .rc-icon--orange { background: #FFF4F0; color: #ff6b35; }
    .rc-icon--blue   { background: #EFF6FF; color: #3B82F6; }
    .rc-icon--purple { background: #F5F3FF; color: #7C3AED; }
    .rc-icon--green  { background: #ECFDF5; color: #10B981; }

    .rc-title {
      flex: 1;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #374151;
    }

    .rc-edit {
      font-size: 12px;
      font-weight: 600;
      color: #ff6b35;
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background 0.15s ease;
    }

    .rc-edit:hover {
      background: #FFF4F0;
    }

    .rc-body {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .rc-name {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .rc-text {
      font-size: 13.5px;
      color: #6B7280;
      margin: 0;
      line-height: 1.55;
    }

    /* Items review list */
    .items-review-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .items-review-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #F3F4F6;
    }

    .items-review-row:last-child {
      border-bottom: none;
    }

    .irr-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .irr-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #D1D5DB;
      flex-shrink: 0;
    }

    .irr-name {
      font-size: 14px;
      font-weight: 500;
      color: #111827;
    }

    .irr-right {
      display: flex;
      gap: 6px;
    }

    .irr-badge {
      padding: 3px 10px;
      background: #fff;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #6B7280;
    }

    /* ─── Actions Row ─── */
    .step-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 36px;
      padding-top: 28px;
      border-top: 1px solid #F3F4F6;
    }

    /* Ghost / Back button */
    .btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      border-radius: 9px;
      background: transparent;
      border: 1.5px solid #E5E7EB;
      color: #4B5563;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.18s ease;
    }

    .btn-ghost:hover {
      background: #F9FAFB;
      border-color: #9CA3AF;
      color: #111827;
    }

    /* Primary / Continue button */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 10px 22px;
      border-radius: 9px;
      background: linear-gradient(135deg, #ff6b35 0%, #e85a28 100%);
      border: none;
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(255,107,53,0.28);
      min-width: 140px;
      justify-content: center;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(255,107,53,0.38);
      background: linear-gradient(135deg, #ff7d4d 0%, #ff6b35 100%);
    }

    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(255,107,53,0.28);
    }

    .btn-primary:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .btn-submit {
      min-width: 170px;
    }

    /* Spinner */
    .spinner {
      width: 15px;
      height: 15px;
      border: 2.5px solid rgba(255,255,255,0.4);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ─── Responsive ─── */
    @media (max-width: 640px) {
      .wiz-header,
      .step-body,
      .stepper {
        padding-left: 20px;
        padding-right: 20px;
      }

      .wiz-title {
        font-size: 1.4rem;
      }

      .grid-2 {
        grid-template-columns: 1fr;
      }

      .review-grid {
        grid-template-columns: 1fr;
      }

      .stepper-track {
        left: calc(20px + 20px);
        right: calc(20px + 20px);
      }

      .step-sub {
        display: none;
      }
    }
  `],
})
export class CreateShipmentComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly api    = inject(ShipmentService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

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

  private addressGroup() {
    return this.fb.nonNullable.group({
      name:    ['', Validators.required],
      phone:   ['', Validators.required],
      street:  ['', Validators.required],
      city:    ['', Validators.required],
      state:   ['', Validators.required],
      country: ['', Validators.required],
      pincode: ['', Validators.required],
    });
  }

  private itemGroup() {
    return this.fb.nonNullable.group({
      itemName:   ['', Validators.required],
      quantity:   [1,    [Validators.required, Validators.min(1)]],
      weight:     [1,    [Validators.required, Validators.min(0.01)]],
      weightUnit: ['kg', Validators.required],
    });
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) this.currentStep++;
  }

  prevStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  goToStep(step: number): void {
    if (step <= this.currentStep) this.currentStep = step;
  }

  addItem(): void    { this.items.push(this.itemGroup()); }
  removeItem(i: number): void { this.items.removeAt(i); }

  onSubmit(): void {
    if (this.form.invalid || this.submitting) return;

    const raw = this.form.getRawValue();
    const request = {
      senderAddress:   raw.senderAddress,
      receiverAddress: raw.receiverAddress,
      items: raw.items.map((i) => ({
        itemName: i.itemName,
        quantity: i.quantity,
        weight: i.weightUnit === 'g' ? i.weight / 1000 : i.weight,
      })),
    };

    this.submitting = true;
    this.api.createShipment(request).subscribe({
      next: (shipment) => {
        this.notify.success('Shipment created successfully!');
        void this.router.navigate(['/shipments', shipment.shipmentId]);
      },
      error: () => { this.submitting = false; },
      complete: () => { this.submitting = false; },
    });
  }
}
