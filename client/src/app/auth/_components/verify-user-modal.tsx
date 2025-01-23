"use client";

import React, { useEffect, useState } from "react";

import { useToast, useVerifyUser } from "@/hooks";

import {
  AlertDialog,
  AlertDialogTrigger,
  Button,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  Input,
} from "@/components";

import { X } from "lucide-react";

interface VerifyUserModalProps {
  isOpen: boolean;
  email: string;
}

export const VerifyUserModal: React.FC<VerifyUserModalProps> = ({ isOpen, email }) => {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { mutate: verifyUserMutation, isPending: isVerifyingPending } = useVerifyUser();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (code === "") {
      toast({
        description: "Code is empty",
      });

      return;
    } 

    // if has a license or organization

    verifyUserMutation({ email, verificationCode: code });
  };

  useEffect(() => {
    setIsModalOpen(isOpen);
  }, [isOpen]);

  return (
    <AlertDialog open={isModalOpen}>
      <AlertDialogContent className="w-[591px] p-8">
        <div className="absolute right-5 top-5">
          <AlertDialogCancel 
            className="shadow-none border-none p-1 rounded-full bg-card"
            onClick={() => setIsModalOpen(false)}
          >
            <X size={18} />
          </AlertDialogCancel>
        </div>

        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">Verify your email</AlertDialogTitle>
          <AlertDialogDescription>
            Enter your verification code
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div>
          <form onSubmit={handleSubmit}>
            <Input
              placeholder="Verification code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              maxLength={6}
            />
            <Button
              variant="secondary"
              className="w-full mt-4"
              loading={isVerifyingPending}
              disabled={isVerifyingPending}
              withLoader={true}
            >
              Verify
            </Button>
          </form>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};