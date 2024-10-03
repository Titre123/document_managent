'use client'

import { Card, CardContent, CardFooter, CardHeader } from "@/app/ui/components/card"
import { Skeleton } from "@/app/ui/components/skeleton"

export function LoadingSkeleton() {
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Skeleton className="h-8 w-64 mx-auto mb-6" />
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card className="bg-blue-600">
          <CardHeader>
            <Skeleton className="h-6 w-32 bg-blue-300" />
          </CardHeader>
          <CardContent className="flex justify-center items-center h-40">
            <Skeleton className="h-12 w-12 rounded-full bg-blue-300" />
          </CardContent>
          <CardFooter className="flex justify-between">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-20 bg-blue-300" />
            ))}
          </CardFooter>
        </Card>
        <Card className="bg-green-600">
          <CardHeader>
            <Skeleton className="h-6 w-40 bg-green-300" />
          </CardHeader>
          <CardContent className="flex justify-center items-center h-40">
            <Skeleton className="h-12 w-12 rounded-full bg-green-300" />
          </CardContent>
          <CardFooter className="flex justify-between">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-20 bg-green-300" />
            ))}
          </CardFooter>
        </Card>
      </div>
      <Skeleton className="w-full h-10" />
    </div>
  )
}