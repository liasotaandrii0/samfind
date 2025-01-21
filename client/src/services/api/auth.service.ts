import { apiClient } from "@/vars";
import { handleApiError } from "@/errors";

export enum UserAuthType {
  Email = "email",
}

const signIn = async (
  email: string,
  password: string,
  authType: UserAuthType
) => {
  try {
    const response = await apiClient.post("/auth/sign-in", {
      email,
      password,
      authType,
    });

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

const signUp = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  authType: UserAuthType
) => {
  try {
    const response = await apiClient.post("/auth/sign-up", {
      firstName,
      lastName,
      email,
      password,
      authType,
    });

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

const sendVerificationCode = async (email: string) => {
  try {
    await apiClient.post("/auth/send-verification-code", {
      email,
    });
  } catch (error) {
    handleApiError(error);
  }
};

const resetPassword = async (
  email: string,
  verificationCode: string,
  newPassword: string
) => {
  try {
    await apiClient.post("/auth/reset-password", {
      email,
      verificationCode,
      newPassword,
    });
  } catch (error) {
    handleApiError(error);
  }
};

const sendVerificationCodeToUpdateEmail = async (
  userId: string,
  email: string,
  password: string
) => {
  try {
    await apiClient.post("/auth/email/send-verification-code", {
      userId,
      email,
      password,
    });
  } catch (error) {
    handleApiError(error);
  }
};

const updateEmail = async (
  userId: string,
  verificationCode: string,
  newEmail: string
) => {
  try {
    await apiClient.post("/auth/email/update", {
      userId,
      verificationCode,
      newEmail,
    });
  } catch (error) {
    handleApiError(error);
  }
};

const verifyUser = async (email: string, verificationCode: string) => {
  try {
    const response = await apiClient.post("/auth/verify", {
      email,
      verificationCode,
    });

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const AuthApiService = {
  signIn,
  signUp,
  sendVerificationCode,
  resetPassword,
  sendVerificationCodeToUpdateEmail,
  updateEmail,
  verifyUser,
};
