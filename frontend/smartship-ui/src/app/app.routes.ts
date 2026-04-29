import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () =>
			import('./features/landing/pages/home/home.component').then((m) => m.HomeComponent),
		pathMatch: 'full',
	},
	{
		path: 'about',
		loadComponent: () =>
			import('./features/landing/pages/about/about.component').then((m) => m.AboutComponent),
	},
	{
		path: 'services',
		loadComponent: () =>
			import('./features/landing/pages/services/services.component').then((m) => m.ServicesComponent),
	},
	{
		path: 'contact',
		loadComponent: () =>
			import('./features/landing/pages/contact/contact.component').then((m) => m.ContactComponent),
	},
	{
		path: 'profile',
		loadComponent: () =>
			import('./features/landing/pages/profile/profile.component').then((m) => m.ProfileComponent),
		canActivate: [authGuard],
	},

	{
		path: 'auth',
		children: [
			{ path: '', redirectTo: 'login', pathMatch: 'full' },
			{
				path: 'login',
				loadComponent: () =>
					import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
			},
			{
				path: 'signup',
				loadComponent: () =>
					import('./features/auth/pages/signup/signup.component').then((m) => m.SignupComponent),
			},
			{
				path: 'verify-otp',
				loadComponent: () =>
					import('./features/auth/pages/verify-otp/verify-otp.component').then((m) => m.VerifyOtpComponent),
			},
			{
				path: 'forgot-password',
				loadComponent: () =>
					import('./features/auth/pages/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
			},
			{
				path: 'reset-password',
				loadComponent: () =>
					import('./features/auth/pages/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
			},
			{
				path: 'oauth-callback',
				loadComponent: () =>
					import('./features/auth/pages/oauth-callback/oauth-callback.component').then((m) => m.OAuthCallbackComponent),
			},
		],
	},

	{
		path: '',
		loadComponent: () =>
			import('./shared/layout/app-shell/app-shell.component').then((m) => m.AppShellComponent),
		canActivate: [authGuard],
		children: [
			{
				path: 'dashboard',
				loadComponent: () =>
					import('./shared/pages/dashboard-route/dashboard-route.component').then((m) => m.DashboardRouteComponent),
				canActivate: [roleGuard],
				data: { roles: ['CUSTOMER', 'ADMIN'] },
			},

			{
				path: 'shipments',
				children: [
					{
						path: 'create',
						loadComponent: () =>
							import('./features/shipments/pages/create-shipment/create-shipment.component').then((m) => m.CreateShipmentComponent),
						canActivate: [roleGuard],
						data: { roles: ['CUSTOMER', 'ADMIN'] },
					},
					{
						path: 'my',
						loadComponent: () =>
							import('./features/shipments/pages/my-shipments/my-shipments.component').then((m) => m.MyShipmentsComponent),
						canActivate: [roleGuard],
						data: { roles: ['CUSTOMER'] },
					},
					{
						path: ':id/pickup',
						loadComponent: () =>
							import('./features/shipments/pages/schedule-pickup/schedule-pickup.component').then((m) => m.SchedulePickupComponent),
						canActivate: [roleGuard],
						data: { roles: ['CUSTOMER'] },
					},
					{
						path: ':id',
						loadComponent: () =>
							import('./features/shipments/pages/shipment-details/shipment-details.component').then((m) => m.ShipmentDetailsComponent),
						canActivate: [roleGuard],
						data: { roles: ['CUSTOMER', 'ADMIN'] },
					},
				],
			},

			{
				path: 'tracking',
				loadComponent: () =>
					import('./features/tracking/pages/tracking/tracking.component').then((m) => m.TrackingComponent),
				canActivate: [roleGuard],
				data: { roles: ['CUSTOMER', 'ADMIN'] },
			},
			{
				path: 'documents',
				loadComponent: () =>
					import('./features/documents/pages/documents/documents.component').then((m) => m.DocumentsComponent),
				canActivate: [roleGuard],
				data: { roles: ['CUSTOMER', 'ADMIN'] },
			},

			{
				path: 'admin',
				loadComponent: () =>
					import('./features/admin/pages/dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
				canActivate: [roleGuard],
				data: { roles: ['ADMIN'] },
			},
			{
				path: 'admin/users',
				loadComponent: () =>
					import('./features/admin/pages/users/admin-users.component').then((m) => m.AdminUsersComponent),
				canActivate: [roleGuard],
				data: { roles: ['ADMIN'] },
			},
			{
				path: 'admin/shipments',
				loadComponent: () =>
					import('./features/admin/pages/shipments/manage-shipments.component').then((m) => m.ManageShipmentsComponent),
				canActivate: [roleGuard],
				data: { roles: ['ADMIN'] },
			},
			{
				path: 'admin/exceptions',
				loadComponent: () =>
					import('./features/admin/pages/exceptions/admin-exceptions.component').then((m) => m.AdminExceptionsComponent),
				canActivate: [roleGuard],
				data: { roles: ['ADMIN'] },
			},
			{
				path: 'admin/hubs-locations',
				loadComponent: () =>
					import('./features/admin/pages/hubs-locations/hubs-locations.component').then((m) => m.HubsLocationsComponent),
				canActivate: [roleGuard],
				data: { roles: ['ADMIN'] },
			},
			{
				path: 'admin/reports',
				loadComponent: () =>
					import('./features/admin/pages/reports/reports.component').then((m) => m.ReportsComponent),
				canActivate: [roleGuard],
				data: { roles: ['ADMIN'] },
			},
			{
				path: 'admin/documents',
				loadComponent: () =>
					import('./features/documents/pages/documents/documents.component').then((m) => m.DocumentsComponent),
				canActivate: [roleGuard],
				data: { roles: ['ADMIN'] },
			},

			{
				path: 'access-denied',
				loadComponent: () =>
					import('./shared/pages/access-denied/access-denied.component').then((m) => m.AccessDeniedComponent),
			},
			{
				path: '**',
				loadComponent: () =>
					import('./shared/pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
			},
		],
	},
];
