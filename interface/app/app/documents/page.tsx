"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/app/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/ui/components/card"
import { Skeleton } from "@/app/ui/components/skeleton"
import { useToast } from "@/app/hooks/use-toast"
import { callASmartContract } from "@/app/lib/utils"
import { useWallet } from '@aptos-labs/wallet-adapter-react'

import { FileText, Pen, Trash2 } from "lucide-react"
import Link from 'next/link'

interface Document {
  id: string;
  name: string;
  created_at: string;
  ipfs_hash: string;
  owner: string;
  signatures: string[];
  url: string;
  users_to_sign: string[];
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSigning, setIsSigning] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [txn, setTxn] = useState<boolean>(false);
  const { toast } = useToast()

  const { account, signAndSubmitTransaction, connected } = useWallet();
  const moduleAddress = process.env.NEXT_PUBLIC_MODULE_ADDRESS;
  const moduleName = process.env.NEXT_PUBLIC_MODULE_NAME;

  useEffect(() => {
    // Simulating API call to fetch documents
    const fetchDocuments = async () => {
      // payload object 
      console.log(`${account?.address}`);
      let response;
      const body = {
        function: `${moduleAddress}::${moduleName}::getAllDocuments`,
        type_arguments: [],
        arguments: [account?.address],
      };

      if(!account?.address || !connected) {
        setDocuments([]);
        setIsLoading(false);
        return;
      }

      if (connected) {
        try {
          response = await fetch("https://fullnode.testnet.aptoslabs.com/v1/view", {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          });

          console.log(response);

          if (response.ok) {
            const documents = await response.json();
            console.log(documents);
            setDocuments(documents[0]);
          } else {
            throw new Error('Failed to fetch documents');
          }
        } catch (error) {
          console.error("Error fetching documents:", error);
          setDocuments([]);
          toast({
            title: "Error",
            description: "Failed to fetch documents. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchDocuments();
  }, [connected, account?.address, moduleAddress, moduleName]);

  const handleSign = async (document: any) => {
    setIsSigning(true);

    if (!document.users_to_sign?.includes(account?.address)) {
      toast({
        title: "Unauthorized",
        description: "You are not authorized to sign this document.",
        variant: "destructive",
      })
      return;
    }

    try {
      const payload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::${moduleName}::SignDocument`,
        type_arguments: [],
        arguments: [document.id],
      };
      setTxn(true);
      await callASmartContract(payload, signAndSubmitTransaction, {
        setTxn,
        description: `Document ${document.id} signed by ${account?.address}`,
        title: "Document Signed",
        toast: toast
      });

    } catch (error) {
      console.error("Error signing document:", error);
    } finally {
      setIsSigning(false);
    }
  }

  const handleDelete = async (document: any) => {
    setIsDeleting(true);

    if (document.owner !== account?.address) {
      toast({
        title: "Unauthorized",
        description: "You are not authorized to delete this document.",
        variant: "destructive",
      })
      return;
    }

    try {
      const payload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::${moduleName}::DeleteDocument`,
        type_arguments: [],
        arguments: [document.id],
      };
      setTxn(true);
      await callASmartContract(payload, signAndSubmitTransaction, {
        setTxn,
        description: `Document ${document.id} deleted by ${account?.address}`,
        title: "Document Deleted",
        toast: toast
      });

    } catch (error) {
      console.error("Error deleting document:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  console.log(documents);

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4 border-[#1F3A93] border-t-4">
        <CardHeader>
          <CardTitle className="text-[#1F3A93]">Your Documents</CardTitle>
          <CardDescription>Manage and sign your documents</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && documents?.length > 0 ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-4">
              {documents?.map(doc => (
                <li key={doc.id} className="flex items-center justify-between p-2 bg-white rounded shadow">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-5 w-5 text-[#1F3A93]" />
                    <span>{doc.name}</span>
                  </div>
                  <div className="flex items-center space-x-4 xl:space-x-6">
                    <span className="text-sm text-gray-500">{doc.created_at}</span>
                    <Button
                      size="sm"
                      className="bg-[#00A8C6] hover:bg-[#0089a3] text-white"
                      onClick={() => handleSign(doc)}
                      disabled={doc.signatures?.includes(account?.address)}
                    >
                      <Pen className="mr-1 h-4 w-4" />
                      Sign
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Link href="/app/create" className="text-[#00A8C6] hover:underline">
        Back to Document Upload
      </Link>
    </div>
  )
}