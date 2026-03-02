import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { ExperienceList } from "../experiences"
import { EducationSection } from "../education-section"
import { ProfileHeader } from "../profile-header"
import { ProfileSidebar } from "../profile-sidebar"

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) redirect('/login')

    // If it's the current user, redirect to the main profile page
    if (id === currentUser.id) {
        redirect('/profile')
    }

    const { data: profile, error } = await supabase
        .from('users')
        .select('*, athlete_profiles(*)')
        .eq('id', id)
        .single()

    if (error || !profile) {
        notFound()
    }

    const { data: experiences } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', id)
        .order('is_current', { ascending: false })
        .order('end_date', { ascending: false })
        .order('start_date', { ascending: false })

    const { data: educations } = await supabase
        .from('educations')
        .select('*')
        .eq('user_id', id)
        .order('start_date', { ascending: false })

    return (
        <div className="bg-[#f4f2ee] min-h-screen py-6">
            <div className="container mx-auto px-4 max-w-[1128px]">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
                    {/* Main Content Column */}
                    <main className="space-y-6">
                        <ProfileHeader profile={profile} isOwnProfile={false} />

                        {/* Experience Section */}
                        <ExperienceList initialExperiences={experiences || []} />

                        {/* Education Section */}
                        <EducationSection initialEducations={educations || []} />
                    </main>

                    {/* Right Sidebar Column */}
                    <aside className="hidden md:block">
                        <ProfileSidebar />
                    </aside>
                </div>
            </div>
        </div>
    )
}
