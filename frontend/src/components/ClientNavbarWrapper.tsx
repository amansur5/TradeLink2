"use client";
import Navbar from "./Navbar";
import { usePathname } from "next/navigation";

export default function ClientNavbarWrapper() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/dashboard/admin");
  const isBuyerRoute = pathname?.startsWith("/dashboard/buyer");
  const isProducerRoute = pathname?.startsWith("/dashboard/producer");
  
  if (isAdminRoute || isBuyerRoute || isProducerRoute) return null;
  return <Navbar />;
} 