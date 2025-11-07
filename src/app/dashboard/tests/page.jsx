import { motion } from "motion/react"; 
import InsightsCard from "@/components/cards/insights";
import TimelineFeed from "@/components/cards/feed-timeline";

export default function Tests(){
    return (
        <div className="px-8 py-6">
            <div>
                <h1 className="text-2xl font-medium">Hypotheses Hub</h1>
                <p className="text-deemphasized-text mt-2">Your automated hypotheses-testing machine</p>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <div className="border border-deemphasized-grid-outline col-span-3">
                    Main content
                </div>
                <div className="gap-4 flex flex-col">
                    <TimelineFeed />
                    <InsightsCard className="" />
                </div>
            </div>
        </div>
    );
}