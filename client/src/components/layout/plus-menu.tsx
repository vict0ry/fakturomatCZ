import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  FileText, 
  Receipt, 
  Users, 
  Calendar,
  Building2
} from "lucide-react";

export function PlusMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          className="rounded-full w-10 h-10 bg-green-600 hover:bg-green-700 text-white border-0 shadow-lg"
          size="sm"
        >
          <Plus className="h-5 w-5" />
          <span className="sr-only">Vytvořit nový</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/invoices?new=true" className="flex items-center w-full">
            <FileText className="h-4 w-4 mr-3 text-blue-600" />
            <div className="flex flex-col">
              <span className="font-medium">Faktura</span>
              <span className="text-xs text-gray-500">Vytvořit novou fakturu</span>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/recurring-invoices?new=true" className="flex items-center w-full">
            <Calendar className="h-4 w-4 mr-3 text-purple-600" />
            <div className="flex flex-col">
              <span className="font-medium">Opakovaná faktura</span>
              <span className="text-xs text-gray-500">Pravidelná fakturace</span>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/expenses/new" className="flex items-center w-full">
            <Receipt className="h-4 w-4 mr-3 text-red-600" />
            <div className="flex flex-col">
              <span className="font-medium">Náklad</span>
              <span className="text-xs text-gray-500">Přidat výdaj nebo náklad</span>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/customers?new=true" className="flex items-center w-full">
            <Users className="h-4 w-4 mr-3 text-orange-600" />
            <div className="flex flex-col">
              <span className="font-medium">Zákazník</span>
              <span className="text-xs text-gray-500">Přidat nového zákazníka</span>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/bank-accounts?new=true" className="flex items-center w-full">
            <Building2 className="h-4 w-4 mr-3 text-gray-600" />
            <div className="flex flex-col">
              <span className="font-medium">Bankovní účet</span>
              <span className="text-xs text-gray-500">Přidat nový účet</span>
            </div>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}