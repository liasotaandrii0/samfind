"use client";

import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context";
import { useUpdateUser } from "@/hooks/api/user";
import { Button, FullScreenLoader, Input } from "@/components";
import { useToast } from "@/hooks";

export default function Settings() {
  const { toast } = useToast();
  const { user, userLoading } = useContext(AuthContext);
  const [editName, setEditName] = useState(false);
  const [editPassword, setEditPassword] = useState(false);
  const [userFormData, setUserFormData] = useState({
    firstName: "",
    lastName: "",
  });
  const [userPasswordFormData, setUserPasswordFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const {
    mutate: updateUserDataMutation,
    isPending: isUpdateUserPending,
    isSuccess: isUpdateUserSuccess,
  } = useUpdateUser();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.name;
    const value = event.target.value;

    setUserFormData({ ...userFormData, [name]: value });
  };

  const handlePasswordFormInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const name = event.target.name;
    const value = event.target.value;

    setUserPasswordFormData({ ...userPasswordFormData, [name]: value });
  };

  const handleSaveSettingsSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (userFormData.firstName === "" || userFormData.lastName === "") {
      toast({
        description: "Some fields are empty",
      });
    }

    if (user)
      updateUserDataMutation({
        id: user?.id,
        userData: userFormData,
      });
    setEditName(false);
  };

  const handleEditCancelSetting = () => {
    if (editName && user)
      setUserFormData({
        firstName: user.firstName,
        lastName: user.lastName,
      });
    setEditName(!editName);
  };

  const handleChangePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (
      userPasswordFormData.newPassword !== userPasswordFormData.confirmPassword
    ) {
      toast({
        description: "Password is not the same",
      });

      return;
    }

    if (
      userPasswordFormData.newPassword === "" ||
      userPasswordFormData.confirmPassword === ""
    ) {
      toast({
        description: "Some fields are empty",
      });

      return;
    }

    if (user) {
      updateUserDataMutation({
        id: user.id,
        userData: { password: userPasswordFormData.newPassword },
      });
    }
    setEditPassword(false);
  };

  const handleEditCancelChangePassword = () => {
    if (editPassword)
      setUserPasswordFormData({
        newPassword: "",
        confirmPassword: "",
      });
    setEditPassword(!editPassword);
  };

  useEffect(() => {
    if (user) {
      setUserFormData({
        firstName: user.firstName,
        lastName: user.lastName,
      });
    }
  }, [user]);

  useEffect(() => {
    if (isUpdateUserSuccess) {
      setUserPasswordFormData({
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [isUpdateUserSuccess]);

  return (
    <div className="pb-[50px] flex justify-center">
      {(isUpdateUserPending || userLoading) && <FullScreenLoader />}
      <div className="w-full">
        <div className="flex justify-between items-center w-full">
          <h2 className="text-[32px] leading-[44px] font-semibold">
            Profile settings
          </h2>
          <p>Private account</p>
        </div>
        <div className="mt-[77px]">
          <h3 className="text-[20px] leading-[27px] font-semibold">
            Personal details
          </h3>
          <div className="w-full mt-6 pb-2 border-b border-[#444444]">
            <div className="flex justify-between items-start w-full">
              <div>
                <div>
                  <div>
                    <p className="text-[16px] leading-[22px] font-semibold">
                      First Name
                    </p>
                    <div className="w-[450px] mt-2">
                      {editName ? (
                        <Input
                          name="firstName"
                          type="text"
                          value={userFormData.firstName}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p className="text-[14px] leading-[29px] text-disabled font-medium">
                          {userFormData.firstName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-6">
                    <p className="text-[16px] leading-[22px] font-semibold">
                      Last Name
                    </p>
                    <div className="w-[450px] mt-2 ">
                      {editName ? (
                        <Input
                          name="lastName"
                          type="text"
                          value={userFormData.lastName}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p className="text-[14px] leading-[29px] text-disabled font-medium">
                          {userFormData.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <Button variant="edit" onClick={handleEditCancelSetting}>
                {editName ? "Cancel" : "Edit"}
              </Button>
            </div>
            {editName && (
              <Button
                className="mt-2 w-[148px]"
                variant="saveProfile"
                onClick={handleSaveSettingsSubmit}
              >
                Save
              </Button>
            )}
          </div>
          <div className="w-full mt-6 pb-2 border-b border-[#444444]">
            <p className="text-[16px] leading-[22px] font-semibold">Email</p>
            <p className="text-[14px] leading-[29px] text-disabled font-medium">
              {user?.email}
            </p>
          </div>
          <div className="w-full mt-6 pb-2 border-b border-[#444444]">
            <div className="flex justify-between items-start w-full">
              <div>
                <p className="text-[16px] leading-[22px] font-semibold">
                  User password
                </p>
                <div className="w-[450px] mt-2">
                  {editPassword ? (
                    <div className="flex gap-2">
                      <Input
                        eye
                        name="newPassword"
                        type="password"
                        value={userPasswordFormData.newPassword}
                        onChange={handlePasswordFormInputChange}
                      />
                      <Input
                        eye
                        name="confirmPassword"
                        type="password"
                        value={userPasswordFormData.confirmPassword}
                        onChange={handlePasswordFormInputChange}
                      />
                    </div>
                  ) : (
                    <p className="text-[14px] leading-[29px] text-disabled font-medium">
                      *********
                    </p>
                  )}
                </div>
              </div>
              <Button variant="edit" onClick={handleEditCancelChangePassword}>
                {editPassword ? "Cancel" : "Edit"}
              </Button>
            </div>
            {editPassword && (
              <Button
                className="mt-2 w-[148px]"
                variant="saveProfile"
                onClick={handleChangePasswordSubmit}
              >
                Save
              </Button>
            )}
          </div>
        </div>
        <div className="mt-[77px]">
          <h3 className="text-[20px] leading-[27px] font-semibold">
            Manage account
          </h3>
          <div className="flex justify-between items-start w-full mt-6 pb-2 border-b border-[#444444]">
            <div className="w-full ">
              <p className="text-[16px] leading-[22px] font-semibold">
                Delete account
              </p>
              <p className="text-[14px] leading-[29px] text-disabled font-medium">
                Permanenlty deactive the account
              </p>
            </div>
            <Button
              className="text-[#FF7676]"
              variant="edit"
              // onClick={() => setEditName(!editName)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
