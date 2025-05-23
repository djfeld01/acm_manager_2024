"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateUserDetails,
  insertUserDetailsSchema,
} from "@/db/schema/userDetails";
import { useToast } from "./ui/use-toast";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { insertUserDetails } from "@/lib/controllers/userController";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
export default function AddEmployeeDetails(): JSX.Element {
  const { toast } = useToast();
  const defaultValues = {
    email: "",
    firstName: "",
    lastName: "",
    paycorEmployeeId: undefined,
  };
  const form = useForm<CreateUserDetails>({
    resolver: zodResolver(insertUserDetailsSchema),
    defaultValues,
  });

  function updateEmail() {
    const firstNameInitial = form
      .getValues("firstName")
      .charAt(0)
      .concat(".")
      .concat(form.getValues("lastName"))
      .concat("@advantageconsultingmanagement.com")
      .toLowerCase();
    form.setValue("email", firstNameInitial);
  }
  async function onSubmit(values: CreateUserDetails) {
    try {
      const response = await insertUserDetails(values);
      toast({
        title: "Database Response",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">
              {JSON.stringify(response, null, 2)}
            </code>
          </pre>
        ),
      });
      form.reset(defaultValues);
      window.location.reload();
    } catch (error) {
      // Handle the error
      if (error) {
        const err = error as Error;
        toast({
          title: "Error",
          description: (
            <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
              <code className="text-white">{err.message}</code>
            </pre>
          ),
        });
      } else {
        console.error("Unknown error:", error);
      }
    }
  }

  return (
    <Card x-chunk="dashboard-01-chunk-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Add Employee</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.log("Validation errors", errors);
            })}
            className="space-y-8"
          >
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem onChange={() => updateEmail()}>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="First Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem onChange={() => updateEmail()}>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Last Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paycorEmployeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paycor ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Paycor Employee ID"
                      value={
                        field.value !== null && field.value !== undefined
                          ? field.value
                          : ""
                      } // Handle null/undefined
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      disabled={field.disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
