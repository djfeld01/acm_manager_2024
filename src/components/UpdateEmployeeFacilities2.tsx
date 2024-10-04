"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  deleteUserFacilitieConnections,
  getUsersWithConnectedFacilities,
  insertUserFacilitiesConnections,
} from "@/lib/controllers/userController";
import { getAllFacilities } from "@/lib/controllers/facilityController";
import { DevTool } from "@hookform/devtools";
import { useToast } from "./ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { revalidatePath } from "next/cache";

// Define types for user and facility data
interface Facility {
  sitelinkId: string;
  facilityAbbreviation: string;
}
interface User {
  id?: string;
  fullName?: string | null;
  usersToFacilities?: { storageFacility: Facility }[];
}

interface Props {
  users: User[];
  facilities: Facility[];
}
// Form type to represent the user's facility selections
interface FormValues {
  userId: string;
  facilityIds: string[];
}

function UpdateEmployeeFacilitiesForm({ users, facilities }: Props) {
  const { toast } = useToast();

  const [selectedUserId, setSelectedUserId] = useState("");
  const form = useForm<FormValues>({
    defaultValues: {
      userId: "",
      facilityIds: [],
    },
  });

  // const selectedUserId = form.watch("userId");

  // Fetch user's current facility associations when a user is selected
  useEffect(() => {
    if (selectedUserId) {
      form.setValue("userId", selectedUserId);
      const loadUserFacilities = () => {
        const fetchedUserFacilities =
          users
            ?.find((user) => selectedUserId === user.id)
            ?.usersToFacilities?.map(
              (facility) => facility?.storageFacility?.sitelinkId
            ) ?? [];
        form.setValue("facilityIds", fetchedUserFacilities);
      };

      loadUserFacilities();
    }
  }, [selectedUserId, form, facilities, users]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    // Prepare the data for submission
    await deleteUserFacilitieConnections(data.userId);
    if (data.facilityIds.length !== 0) {
      const updatedUserFacilities = data.facilityIds.map((facilityId) => ({
        userId: data.userId,
        storageFacilityId: facilityId,
      }));
      await insertUserFacilitiesConnections(updatedUserFacilities);

      toast({
        title: "You submitted the following values:",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">
              {JSON.stringify(updatedUserFacilities, null, 2)}
            </code>
          </pre>
        ),
      });
      window.location.reload();
    }

    // // Post updated user-facility associations to the backend
    // await fetch("/api/update-user-facilities", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(updatedUserFacilities),
    // });
  };

  return (
    <Card x-chunk="dashboard-01-chunk-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">
          Update User Access
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* User Dropdown */}
            <FormItem>
              <FormControl>
                <FormField
                  name="userId"
                  render={({ field }) => (
                    <Select onValueChange={setSelectedUserId}>
                      <SelectTrigger className="mx-4 w-72">
                        <SelectValue placeholder="Select a User" />
                      </SelectTrigger>{" "}
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Users</SelectLabel>
                        </SelectGroup>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user?.id ?? ""}>
                            {user.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormControl>
              {form.formState.errors.userId && (
                <FormMessage>
                  {form.formState.errors.userId.message}
                </FormMessage>
              )}
            </FormItem>

            {/* Facility Checkboxes */}

            <FormField
              control={form.control}
              name="facilityIds"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Facilities</FormLabel>
                    <FormDescription>
                      Select the stores this user is associated with.
                    </FormDescription>
                  </div>
                  {facilities.map((facility) => (
                    <FormField
                      key={facility.sitelinkId}
                      control={form.control}
                      name="facilityIds"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={facility.sitelinkId}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(
                                  facility.sitelinkId
                                )}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([
                                        ...field.value,
                                        facility.sitelinkId,
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) =>
                                            value !== facility.sitelinkId
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {facility.facilityAbbreviation}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </FormItem>
              )}
            />

            <Button type="submit">Submit</Button>
          </form>
          {/* <DevTool control={form.control} /> */}
        </Form>
      </CardContent>
    </Card>
  );
}

export default UpdateEmployeeFacilitiesForm;
