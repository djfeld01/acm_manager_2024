"use client";

import { addBankTransactions } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { parseBankDownloads } from "@/lib/parseBankDownloads";
import { ArrowBigUp } from "lucide-react";
import React from "react";

function UploadButton() {
  const [isSubmitClick, setIsSubmitClick] = React.useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSubmitClick(true);
    const files = e.target.files;

    // If no files are selected, reset the state and return
    if (!files || files.length === 0) {
      setIsSubmitClick(false);
      return;
    }

    try {
      const result = await parseBankDownloads(files);
      await addBankTransactions(result);
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      // Always reset the state, even if there's an error
      setIsSubmitClick(false);
    }
  };

  return (
    <>
      {isSubmitClick ? (
        <Button disabled>
          <ArrowBigUp className="mr-2 h-4 w-4 animate-spin" />
          Uploading...
        </Button>
      ) : (
        <>
          <Button
            color="primary"
            onClick={() => {
              document.getElementById("file-upload")?.click();
            }}
          >
            <ArrowBigUp className="mr-2 h-4 w-4" />
            Upload Bank Downloads
          </Button>
          <input
            type="file"
            accept=".qbo"
            multiple
            onChange={handleFileUpload}
            id="file-upload"
            style={{ display: "none" }}
          />
        </>
      )}
    </>
  );
}

export default UploadButton;
