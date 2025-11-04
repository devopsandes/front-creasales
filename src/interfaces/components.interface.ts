import { IconType } from "react-icons";
import { LucideIcon } from "lucide-react";

export interface DashItemInterface {
    icon: IconType | LucideIcon
    path: string
    titulo: string
}