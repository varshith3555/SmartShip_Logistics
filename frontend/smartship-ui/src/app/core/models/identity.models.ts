export interface UserDto {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: string;
}

export interface UpdateUserRequest {
  name: string;
  phone: string;
  role: string;
}

export interface RoleDto {
  roleName: string;
}

export interface AssignRoleRequest {
  role: string;
}

export interface UpdateProfileRequest {
  name: string;
  phone: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
