import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AssignRoleRequest,
  ChangePasswordRequest,
  CreateUserRequest,
  RoleDto,
  UpdateProfileRequest,
  UpdateUserRequest,
  UserDto,
} from '../models/identity.models';
import { ApiClient } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class IdentityService {
  constructor(private readonly api: ApiClient) {}

  private normalizeIsoAsUtc(value: string): string {
    if (!value) return value;
    // If it already contains a timezone/offset, keep as-is.
    if (/[zZ]$/.test(value) || /[+-]\d{2}:\d{2}$/.test(value)) return value;
    // If it's an ISO string without timezone, treat it as UTC.
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value)) return `${value}Z`;
    return value;
  }

  private normalizeUser(user: UserDto): UserDto {
    return {
      ...user,
      createdAt: this.normalizeIsoAsUtc(user.createdAt),
    };
  }

  // ADMIN
  getUsers(): Observable<UserDto[]> {
    return this.api.get<UserDto[]>('/gateway/identity/Users').pipe(map((u) => u.map((x) => this.normalizeUser(x))));
  }

  getUserById(id: string): Observable<UserDto> {
    return this.api.get<UserDto>(`/gateway/identity/Users/${id}`).pipe(map((u) => this.normalizeUser(u)));
  }

  createUser(request: CreateUserRequest): Observable<UserDto> {
    return this.api.post<UserDto>('/gateway/identity/Users', request).pipe(map((u) => this.normalizeUser(u)));
  }

  updateUser(id: string, request: UpdateUserRequest): Observable<void> {
    return this.api.put<void>(`/gateway/identity/Users/${id}`, request);
  }

  deleteUser(id: string): Observable<void> {
    return this.api.delete<void>(`/gateway/identity/Users/${id}`);
  }

  // ADMIN
  getRoles(): Observable<RoleDto[]> {
    return this.api.get<RoleDto[]>('/gateway/identity/Roles');
  }

  // ADMIN
  assignRole(userId: string, request: AssignRoleRequest): Observable<void> {
    return this.api.put<void>(`/gateway/identity/Users/${userId}/role`, request);
  }

  // Authenticated
  getProfile(): Observable<UserDto> {
    return this.api.get<UserDto>('/gateway/identity/profile').pipe(map((u) => this.normalizeUser(u)));
  }

  updateProfile(request: UpdateProfileRequest): Observable<void> {
    return this.api.put<void>('/gateway/identity/profile', request);
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.api.put<void>('/gateway/identity/profile/change-password', request);
  }
}
