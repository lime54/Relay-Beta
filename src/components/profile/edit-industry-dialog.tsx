"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Briefcase, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"
import { updateIndustry } from "@/app/(dashboard)/profile/actions"

const SECTORS = [
  "Finance & Banking", "Consulting", "Technology & Software", 
  "Healthcare & Medicine", "Law", "Sports Management & Coaching",
  "Media, Entertainment & Content", "Marketing & Advertising", 
  "Real Estate", "Education", "Government & Public Policy",
  "Nonprofit & Social Impact", "Entrepreneurship / Startups", 
  "Engineering", "Sales & Business Development"
];

interface EditIndustryDialogProps {
  currentIndustry: string | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function EditIndustryDialog({ currentIndustry, isOpen, onOpenChange }: EditIndustryDialogProps) {
  const router = useRouter()
  const [selectedIndustry, setSelectedIndustry] = useState<string>(currentIndustry || SECTORS[0])
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setIsUpdating(true)
    setError("")

    try {
      const result = await updateIndustry(selectedIndustry)
      if (result?.error) {
        setError(result.error)
      } else {
        router.refresh()
        onOpenChange(false)
      }
    } catch (err: any) {
      setError("An unexpected error occurred.")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-border/40 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-secondary" />
            Industry Sector
          </DialogTitle>
          <DialogDescription>
            Select your primary professional industry. This helps perfectly match you with others in your field.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-primary">Primary Industry</label>
            <Select 
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full bg-muted/50 border-border shadow-sm h-12 rounded-xl px-4 text-sm"
              disabled={isUpdating}
            >
              {SECTORS.map((sector) => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </Select>
          </div>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
        </div>

        <DialogFooter className="sm:justify-between flex-row gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
            className="flex-1 rounded-xl h-12"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isUpdating || !selectedIndustry}
            className="flex-1 rounded-xl h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-bold"
          >
            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
