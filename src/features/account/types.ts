export interface UserProfile {
  id: string;
  name: string;
  email: string;
  pictureUrl?: string;
}

export interface AccountState {
  isLoggedIn: boolean;
  isLoading: boolean;
  profile?: UserProfile;
  error?: string;
}
