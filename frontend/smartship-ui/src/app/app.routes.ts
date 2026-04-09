import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AppShellComponent } from './shared/layout/app-shell/app-shell.component';
import { AccessDeniedComponent } from './shared/pages/access-denied/access-denied.component';
import { NotFoundComponent } from './shared/pages/not-found/not-found.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { SignupComponent } from './features/auth/pages/signup/signup.component';
import { VerifyOtpComponent } from './features/auth/pages/verify-otp/verify-otp.component';
import { OAuthCallbackComponent } from './features/auth/pages/oauth-callback/oauth-callback.component';
import { ForgotPasswordComponent } from './features/auth/pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/pages/reset-password/reset-password.component';
import { DashboardComponent } from './features/customer/pages/dashboard/dashboard.component';
import { CreateShipmentComponent } from './features/shipments/pages/create-shipment/create-shipment.component';
import { MyShipmentsComponent } from './features/shipments/pages/my-shipments/my-shipments.component';
import { ShipmentDetailsComponent } from './features/shipments/pages/shipment-details/shipment-details.component';
import { TrackingComponent } from './features/tracking/pages/tracking/tracking.component';
import { DocumentsComponent } from './features/documents/pages/documents/documents.component';
import { AdminDashboardComponent } from './features/admin/pages/dashboard/admin-dashboard.component';
import { ManageShipmentsComponent } from './features/admin/pages/shipments/manage-shipments.component';
import { HubsLocationsComponent } from './features/admin/pages/hubs-locations/hubs-locations.component';
import { ReportsComponent } from './features/admin/pages/reports/reports.component';
import { AdminUsersComponent } from './features/admin/pages/users/admin-users.component';
import { AdminExceptionsComponent } from './features/admin/pages/exceptions/admin-exceptions.component';
import { DashboardRouteComponent } from './shared/pages/dashboard-route/dashboard-route.component';
import { HomeComponent } from './features/landing/pages/home/home.component';
import { AboutComponent } from './features/landing/pages/about/about.component';
import { ServicesComponent } from './features/landing/pages/services/services.component';
import { ContactComponent } from './features/landing/pages/contact/contact.component';
import { ProfileComponent } from './features/landing/pages/profile/profile.component';

export const routes: Routes = [
	{ path: '', component: HomeComponent, pathMatch: 'full' },
	{ path: 'about', component: AboutComponent },
	{ path: 'services', component: ServicesComponent },
	{ path: 'contact', component: ContactComponent },
	{ path: 'profile', component: ProfileComponent, canActivate: [authGuard] },

	{
		path: 'auth',
		children: [
			{ path: '', redirectTo: 'login', pathMatch: 'full' },
			{ path: 'login', component: LoginComponent },
			{ path: 'signup', component: SignupComponent },
			{ path: 'verify-otp', component: VerifyOtpComponent },
			{ path: 'forgot-password', component: ForgotPasswordComponent },
			{ path: 'reset-password', component: ResetPasswordComponent },
			{ path: 'oauth-callback', component: OAuthCallbackComponent },
		],
	},

	{
		path: '',
		component: AppShellComponent,
		canActivate: [authGuard],
		children: [
			{
				path: 'dashboard',
				component: DashboardRouteComponent,
				canActivate: [roleGuard],
				data: { roles: ['CUSTOMER', 'ADMIN'] },
			},

			{
				path: 'shipments',
				children: [
					{
						path: 'create',
						component: CreateShipmentComponent,
						canActivate: [roleGuard],
						data: { roles: ['CUSTOMER', 'ADMIN'] },
					},
					{
						path: 'my',
						component: MyShipmentsComponent,
						canActivate: [roleGuard],
						data: { roles: ['CUSTOMER'] },
					},
					{
						path: ':id',
						component: ShipmentDetailsComponent,
						canActivate: [roleGuard],
						data: { roles: ['CUSTOMER', 'ADMIN'] },
					},
				],
			},

			{
				path: 'tracking',
				component: TrackingComponent,
				canActivate: [roleGuard],
				data: { roles: ['CUSTOMER', 'ADMIN'] },
			},
			{
				path: 'documents',
				component: DocumentsComponent,
				canActivate: [roleGuard],
				data: { roles: ['CUSTOMER', 'ADMIN'] },
			},

			{
				path: 'admin',
				component: AdminDashboardComponent,
				canActivate: [roleGuard],
				data: { roles: ['ADMIN'] },
			},
			{
				path: 'admin/users',
				component: AdminUsersComponent,
				canActivate: [roleGuard],
				data: { roles: ['ADMIN'] },
			},
			{
				path: 'admin/shipments',
				component: ManageShipmentsComponent,
				canActivate: [roleGuard],
				data: { roles: ['ADMIN'] },
			},
			{
				path: 'admin/exceptions',
				component: AdminExceptionsComponent,
				canActivate: [roleGuard],
				data: { roles: ['ADMIN'] },
			},
			{
				path: 'admin/hubs-locations',
				component: HubsLocationsComponent,
				canActivate: [roleGuard],
				data: { roles: ['ADMIN'] },
			},
			{
				path: 'admin/reports',
				component: ReportsComponent,
				canActivate: [roleGuard],
				data: { roles: ['ADMIN'] },
			},
			{
				path: 'admin/documents',
				component: DocumentsComponent,
				canActivate: [roleGuard],
				data: { roles: ['ADMIN'] },
			},

			{ path: 'access-denied', component: AccessDeniedComponent },
			{ path: '**', component: NotFoundComponent },
		],
	},
];
