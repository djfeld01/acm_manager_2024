import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { CirclePlusIcon } from "lucide-react";
import { Button } from "./ui/button";

function EmployeeMileageComponent() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="col-span-1 grid grid-cols-2">
        <div className="p-2">Add Mileage</div>
        <div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost">
              <CirclePlusIcon className="h-4 w-4 m-1" />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div>A Mileage form should go here</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default EmployeeMileageComponent;
