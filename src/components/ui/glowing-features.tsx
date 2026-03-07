"use client";

import { CheckCircle, Users, MessageSquare, TrendingUp } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

export function GlowingFeatures() {
    return (
        <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-2 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
            <GridItem
                area="md:[grid-area:1/1/2/13] xl:[grid-area:1/1/2/7]"
                icon={<Users className="h-5 w-5 text-primary" />}
                title="Shared athlete experience"
                description="Athletes develop discipline, resilience, and the ability to handle setbacks. These shared traits drive professional success and create a powerful, instant bond."
            />
            <GridItem
                area="md:[grid-area:2/1/3/13] xl:[grid-area:1/7/2/13]"
                icon={<CheckCircle className="h-5 w-5 text-primary" />}
                title="Verified Community"
                description="Every member is a verified NCAA student-athlete or alumni (D1, D2, D3). No strangers, no spam. Only a shared athletic background."
            />
            <GridItem
                area="md:[grid-area:3/1/4/13] xl:[grid-area:2/1/3/7]"
                icon={<MessageSquare className="h-5 w-5 text-primary" />}
                title="Structured Requests"
                description="No &quot;picking your brain.&quot; Every ask is specific, respectful, and actionable—saving time for everyone."
            />
            <GridItem
                area="md:[grid-area:4/1/5/13] xl:[grid-area:2/7/3/13]"
                icon={<TrendingUp className="h-5 w-5 text-primary" />}
                title="Trackable Outcomes"
                description="Track your impact. From coffee chats to referrals, see how you're helping the next generation win."
            />
        </ul>
    );
}

interface GridItemProps {
    area: string;
    icon: React.ReactNode;
    title: string;
    description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
    return (
        <li className={cn("min-h-[14rem] list-none", area)}>
            <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
                <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={3}
                />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6">
                    <div className="relative flex flex-1 flex-col justify-between gap-3">
                        <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-2">
                            {icon}
                        </div>
                        <div className="space-y-3">
                            <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-foreground">
                                {title}
                            </h3>
                            <h2 className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">
                                {description}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
};
