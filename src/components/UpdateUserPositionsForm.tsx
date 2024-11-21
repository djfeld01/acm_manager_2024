"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";

type Facility = {
  sitelinkId: string;
  facilityAbbreviation: string;
  position: string | null;
};

type User = {
  id: string;
  fullName: string;
  facilities: Facility[];
};

type FormValues = {
  updates: {
    storageFacilityId: string;
    position: string | null;
  }[];
};

const UpdateUserPositionsForm = () => {
  const { control, handleSubmit, setValue, watch, register } =
    useForm<FormValues>();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    // Fetch users and their facilities
    const fetchUsers = async () => {
      const response = await axios.get("/api/users-with-facilities");
      setUsers(response.data);
    };

    fetchUsers();
  }, []);

  const handleUserChange = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    setSelectedUser(user || null);

    // Populate form values with current positions
    if (user) {
      const updates = user.facilities.map((facility) => ({
        storageFacilityId: facility.sitelinkId,
        position: facility.position,
      }));
      setValue("updates", updates);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!selectedUser) return;

    await axios.put("/api/updatePosition", {
      userId: selectedUser.id,
      updates: data.updates,
    });

    alert("Positions updated successfully!");
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* User Dropdown */}
        <div>
          <label htmlFor="user">Select User:</label>
          <select
            id="user"
            onChange={(e) => handleUserChange(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>
              Choose a user
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Facility Positions */}
        {selectedUser && (
          <div>
            <h3>Update Positions for {selectedUser.fullName}</h3>
            {selectedUser.facilities.map((facility, index) => (
              <div key={facility.sitelinkId} className="facility-row">
                <span>{facility.facilityAbbreviation}</span>
                <Controller
                  name={`updates.${index}.position`}
                  control={control}
                  defaultValue={facility.position}
                  render={({ field }) => (
                    <select {...field} value={field.value ?? ""}>
                      <option value="">No Position</option>
                      <option value="ACM_OFFICE">ACM Office</option>
                      <option value="AREA_MANAGER">Area Manager</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ASSISTANT">Assistant</option>
                      <option value="STORE_OWNER">Store Owner</option>
                    </select>
                  )}
                />
                <input
                  type="hidden"
                  value={facility.sitelinkId}
                  {...register(`updates.${index}.storageFacilityId`)}
                />
              </div>
            ))}
          </div>
        )}

        <button type="submit">Update Positions</button>
      </form>
    </div>
  );
};

export default UpdateUserPositionsForm;
