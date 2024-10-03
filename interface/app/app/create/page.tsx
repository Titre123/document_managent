'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'

import { Button } from "@/app/ui/components/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/ui/components/card"
import { Input } from "@/app/ui/components/input"
import { Label } from "@/app/ui/components/label"
import { Skeleton } from "@/app/ui/components/skeleton"
import { FileSignature, Upload, Wallet, FileText, X } from "lucide-react"
import Link from 'next/link'
import { useToast } from "@/app/hooks/use-toast"
import { ToastAction } from "@/app/ui/components/toast"
import { PinataSDK } from "pinata-web3";
import { nanoid } from 'nanoid';
import { callASmartContract } from '@/app/lib/utils';


export default function DocumentManagement() {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [txn, setTxn] = useState<boolean>(false);
  const { toast } = useToast();

  const moduleAddress = process.env.NEXT_PUBLIC_MODULE_ADDRESS;
  const moduleName = process.env.NEXT_PUBLIC_MODULE_NAME;

  const pinata = new PinataSDK({
    pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT_KEY,
    pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
  });

  const { account, signAndSubmitTransaction, connected } = useWallet();

  useEffect(() => {
    // Apply global styles
    document.body.style.fontFamily = '"Karla", sans-serif'
    document.body.style.backgroundColor = '#f0f4f8'
  }, [])


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file before uploading.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const upload = await pinata.upload.file(selectedFile);
      const payload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::${moduleName}::CreateDocument`,
        type_arguments: [],
        arguments: [selectedFile.name, upload.IpfsHash, nanoid(), `https://violet-patient-squid-248.mypinata.cloud/ipfs/${upload.IpfsHash}`],
      };
      setTxn(true);
      await callASmartContract(payload, signAndSubmitTransaction,
        {
          setTxn,
          description: `Document created by ${account?.address}`,
          title: "Document Created",
          toast: toast
        });
    } catch (error) {
      console.error("Error uploading file to IPFS:", error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  // Remove the main function as it's no longer neede

  if (!connected) {
    return (
      <div className="container min-h-screen flex justify-center items-center mx-auto p-4">
        <div className='w-full max-w-[900px]'>
          <Card className="border-[#1F3A93] border-t-4">
            <CardHeader>
              <CardTitle><Skeleton className="h-4" /></CardTitle>
              <CardDescription><Skeleton className="h-4" /></CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4  mb-2" />
              <Skeleton className="h-4 mb-2" />
              <Skeleton className="h-4 " />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container min-h-screen flex justify-center items-center mx-auto p-4">
      <div className='w-full max-w-[900px]'>
        <Card className="mb-4 border-[#1F3A93] border-t-4">
          <CardHeader>
            <CardTitle className="text-[#1F3A93]">Document Management</CardTitle>
            <CardDescription>Upload and manage your documents securely.</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedFile ? (
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="document" className="text-[#1F3A93] font-semibold">Upload Document</Label>
                <div
                  className="relative"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      const file = files[0];
                      setSelectedFile(file);
                      // Handle the dropped file here
                    }
                  }}
                >
                  <Input
                    id="document"
                    type="file"
                    className="cursor-pointer opacity-0 absolute inset-0 w-full h-full"
                    onChange={handleFileChange}
                  />
                  <div className="border-2 border-dashed border-[#1F3A93] rounded-md p-4 text-center">
                    <Upload className="mx-auto h-12 w-12 text-[#1F3A93]" />
                    <p className="mt-2 text-sm text-gray-600">Drag and drop a file here, or click to select a file</p>
                    <p className="mt-1 text-xs text-gray-500">Supported formats: PDF, DOC, DOCX</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#F0F4FF] border border-[#1F3A93] rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-[#1F3A93] mr-3" />
                    <div>
                      <p className="font-semibold text-[#1F3A93]">{selectedFile.name}</p>
                      <p className="text-sm text-gray-600">
                        {selectedFile.size < 1024 * 1024
                          ? `${(selectedFile.size / 1024).toFixed(2)} KB`
                          : `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setSelectedFile(null)}
                    variant="ghost"
                    size="icon"
                    className="text-[#00A8C6] hover:text-[#1F3A93]"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={handleUpload} disabled={isUploading} className="bg-[#1F3A93] hover:bg-[#162a6b] text-white">
              {isUploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        <Link href="/app/documents" className="text-[#00A8C6] hover:underline">
          View All Documents
        </Link>
      </div>
    </div>
  )
}