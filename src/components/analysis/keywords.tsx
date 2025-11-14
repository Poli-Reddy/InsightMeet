import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tags } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface KeywordsProps {
  keywords: string[];
}

export default function Keywords({ keywords }: KeywordsProps) {
  return (
    <Card className="shadow-md overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Tags className="h-5 w-5 text-primary" />
              Keywords & Entities
            </CardTitle>
            <CardDescription>Key subjects, names, and products discussed.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Badge variant="secondary">{keyword}</Badge>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
