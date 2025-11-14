import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListTodo } from "lucide-react";
import { motion } from "framer-motion";

interface ActionItemsProps {
  actionItems: string[];
}

export default function ActionItems({ actionItems }: ActionItemsProps) {
  return (
    <Card className="shadow-md overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-primary" />
              Action Items
            </CardTitle>
            <CardDescription>Tasks and assignments identified from the meeting.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {actionItems.map((item, index) => (
            <motion.li key={index} className="flex items-start" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
              <ListTodo className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
              <span>{item}</span>
            </motion.li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
