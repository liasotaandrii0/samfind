"use client";

import { useContext, useEffect, useState } from "react";

import {
  useGetInvitedUserInfo,
  useGetUserLicenses,
  useGetUserSubscriptionInfo,
  useToast,
} from "@/hooks";

import Link from "next/link";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from "@/components";

import { ReusableTable } from "@/components/table";
import { AuthContext } from "@/context";
import { DeleteMember, InviteMember, ProgressChart } from "./_components";

import {
  ArrowUpDown,
  Check,
  Copy,
  Info,
  MoreHorizontal,
  Search,
  User,
  Download,
} from "lucide-react";
import { LicenseTierType } from "@/types";

import { format } from "date-fns";

const frontendDomain = process.env.NEXT_PUBLIC_FRONTEND_DOMAIN;

const headers = {
  name: "name",
  email: "email",
  date: "date of activation",
  access: "access rights",
  license: "license key",
};

interface LicenseItem {
  licenseId: string;
  userId: string;
  icon?: string;
  name: string;
  email: string;
  date?: string;
  access: string;
}

const columns: ColumnDef<LicenseItem>[] = [
  {
    accessorKey: "icon",
    header: () => <div className="w-[50px]" />,
    cell: ({ row }) => {
      const value: string = row.getValue(headers.name);

      return (
        <div
          className="
            flex justify-center items-center rounded-full 
            w-10 h-10 bg-input text-[24px] leading-[33px] 
            text-link-hover font-semibold
          "
        >
          {value[0]}
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        className="text-disabled uppercase text-left pl-0"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>{headers.name}</span>
        <ArrowUpDown />
      </Button>
    ),
  },
  {
    accessorKey: "email",
    header: () => (
      <div className="text-disabled uppercase">{headers.email}</div>
    ),
    cell: ({ row }) => <div>{row.getValue(headers.email)}</div>,
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        className="text-disabled uppercase text-left pl-0"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {headers.date}
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("date")}</div>,
  },
  {
    accessorKey: "access",
    header: () => {
      return (
        <div className="relative overflow-visible flex items-center gap-2 text-disabled uppercase">
          <span>{headers.access}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info style={{ width: "14px", height: "14px" }} />
              </TooltipTrigger>
              <TooltipContent className="p-4 bg-[#232323] max-w-[300px] rounded-[30px] text-xs font-medium text-[#A8A8A8] normal-case">
                As an Owner, you can add other users to your group. You’ll be
                responsible for covering their license fees.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
    cell: ({ row }) => (
      <div>
        {row.getValue("access") === "Owner" ? (
          <span className="text-blue-50">Owner</span>
        ) : (
          <span>Member</span>
        )}
      </div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <>
          {row.original.access === "Member" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-input border-none" align="end">
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <DeleteMember
                    licenseId={row.original.licenseId}
                    memberId={row.original.userId}
                    userName={row.original.name}
                    email={row.original.email}
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </>
      );
    },
  },
];

const FREEMIUM_FEATURES = [
  {
    title: "Essential features",
  },
  {
    title: "Community access",
  },
  {
    title: "Basic support",
  },
];

const INVITED_USER_FEATURES = [
  {
    title: "Enhanced capabilities",
  },
  {
    title: "Priority updates",
  },
  {
    title: "Premium support",
  },
];

export default function License() {
  const { user } = useContext(AuthContext);
  const { toast } = useToast();

  const [users, setUsers] = useState<LicenseItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const { data: userLicense, isPending: isUserLicensesPending } =
    useGetUserLicenses();

  const { data: userSubscriptionInfo } = useGetUserSubscriptionInfo();

  const { data: invitedUserData } = useGetInvitedUserInfo();

  const itemsPerPage = 10;
  const pageCount = Math.ceil(userLicense?.users?.length ?? 0 / itemsPerPage);

  const handleCopyInvitation = () => {
    if (user) {
      let link = `${frontendDomain}/auth/sign-up?accountType=private`;

      if (user.organizationId) {
        link = `${link}&orgId=${user.organizationId}`;
      }

      if (user.licenseId) {
        link = `${link}&lId=${user.licenseId}`;
      }

      navigator.clipboard.writeText(link);

      toast({
        description: "Copied",
      });
    }
  };

  function formatDate(dateString: string): string {
    const date = new Date(dateString);

    return format(date, "MMMM dd, yyyy");
  }

  useEffect(() => {
    if (userLicense?.users && user) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;

      const selectedUsers = userLicense.users
        .slice(startIndex, endIndex)
        .map((u) => ({
          licenseId: userLicense.id,
          userId: u.id,
          name: u.name,
          email: u.email,
          date: new Intl.DateTimeFormat("ru-RU").format(new Date(u.date)),
          access: u.email === user?.email ? "Owner" : "Member",
          license: u.license,
        }));

      setUsers([...selectedUsers]);
    }
  }, [userLicense, currentPage, user]);

  const table = useReactTable({
    data: users,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="w-full">
        <h2 className="text-[32px] leading-[44px] font-semibold">
          License management
        </h2>

        {userLicense?.tierType !== LicenseTierType.Freemium && (
          <>
            {userLicense &&
              !isUserLicensesPending &&
              !isUserLicensesPending && (
                <>
                  <div className="mt-6 flex justify-between items-end">
                    <ProgressChart
                      currentMembers={userLicense.users.length}
                      maxMembers={userLicense.limit}
                    />
                    <div className="flex items-center gap-6">
                      <button
                        onClick={handleCopyInvitation}
                        className="text-blue-50 bg-card p-2 rounded-full"
                      >
                        <Copy size={24} />
                      </button>
                      <InviteMember allowedMembers={userLicense.limit} />
                    </div>
                  </div>
                  <div className="flex items-center justify-end py-4">
                    <div className="w-[308px] relative">
                      <Input
                        placeholder="Search"
                        value={
                          (table
                            .getColumn("name")
                            ?.getFilterValue() as string) ?? ""
                        }
                        onChange={(event) =>
                          table
                            .getColumn("name")
                            ?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm bg-card"
                      />
                      <div className="absolute right-6 top-0 h-full flex justify-center items-center">
                        <Search size={24} />
                      </div>
                    </div>
                  </div>

                  <ReusableTable
                    table={table}
                    isLoading={isUserLicensesPending}
                    onPageChange={(page: number) => setCurrentPage(page)}
                    pageCount={pageCount}
                    noDataMessage="No licenses found."
                  />
                </>
              )}
          </>
        )}

        {userSubscriptionInfo?.organizationOwner && !userLicense && (
          <>
            <div
              className="
                flex justify-between items-center rounded-[20px] 
                p-6 bg-violet-400/10 mt-4
              "
            >
              <div>
                <h2 className="text-xl font-semibold">
                  Upgrade your subscription and unlock more features!
                </h2>
                <p>
                  Boost your capabilities with premium features and priority
                  support.
                </p>
              </div>
              <Link href="/account/billing-data">
                <Button variant="tetrary">Get started</Button>
              </Link>
            </div>
          </>
        )}

        {userSubscriptionInfo?.freemiumUser && (
          <>
            <div className="flex flex-col gap-[32px] mt-[60px] w-[742px]">
              <div
                className="
                  flex justify-between items-center rounded-[20px] 
                  p-6 bg-violet-400/10
                "
              >
                <div>
                  <h2 className="text-xl font-semibold">
                    Upgrade your subscription and unlock more features!
                  </h2>
                  <p>
                    Boost your capabilities with premium features and priority
                    support.
                  </p>
                </div>
                <Link href="/account/billing-data">
                  <Button variant="tetrary">Get started</Button>
                </Link>
              </div>

              <div className="capitalize text-blue-50 flex items-center justify-center gap-2 bg-card rounded-full px-3 py-2  w-[200px]">
                <User size={18} />
                {user?.accountType} Account
              </div>

              <div>
                <p className="text-xl">Plan</p>

                <div className="border-b border-card py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <p>Freemium</p>
                    <span className="bg-green-500/5 p-2 px-4 text-xs text-green-600 rounded-full">
                      Active subscription
                    </span>
                  </div>
                  <Link href="/account/billing-data" className="underline">
                    Upgrade
                  </Link>
                </div>

                <ul className="flex items-center gap-5 mt-8">
                  {FREEMIUM_FEATURES.map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check size={16} className="text-violet-50" />
                      <span>{item.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}

        {userSubscriptionInfo?.invitedUser && (
          <div className="mt-4">
            <div className="capitalize text-blue-50 flex items-center justify-center gap-2 bg-card rounded-full px-3 py-2 w-[200px]">
              <User size={18} />
              {user?.accountType} Account
            </div>

            <div className="flex justify-between items-start mt-4">
              <div className="p-4 rounded-lg bg-card w-[330px]">
                <p>
                  You have joined the workspace of the user{" "}
                  <span className="capitalize text-blue-50">{`${invitedUserData?.licenseOwner.firstName} ${invitedUserData?.licenseOwner.lastName}`}</span>
                  and use access to the license.
                </p>
              </div>
              <ul className="flex flex-col gap-2">
                {INVITED_USER_FEATURES.map((item, index) => (
                  <li key={index} className="flex gap-3">
                    <Check size={20} className="text-violet-50" />
                    <span>{item.title}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4">
              <p className="text-2xl">Plan</p>
              <div className="mt-3">
                <div className="flex items-center gap-3">
                  <p className="capitalize text-lg">
                    {invitedUserData?.license.tierType}
                  </p>
                  <span className="bg-green-500/5 p-2 px-4 text-xs text-green-600 rounded-full">
                    Active subscription
                  </span>
                </div>

                {/* <p className="opacity-50 mt-2">Renews {invitedUserData?.license?.updatedAt && formatDate(invitedUserData.license.updatedAt)}</p> */}
                <Link
                  href="/download-app"
                  className="
                    bg-violet-100 flex gap-2 items-center w-[200px] 
                    justify-center mt-4 text-white rounded-full px-3 
                    py-2 capitalize hover:opacity-70
                  "
                >
                  <Download size={24} />
                  <span>Download app</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
