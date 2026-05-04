// Deep-link targets for opening specific editors on the profile page.
// Used by dashboard "Profile completion" suggestions and any other call-site
// that wants to land users directly into a particular edit UI.

export type ProfileEditTarget =
    | 'industry_sector'
    | 'avatar'
    | 'resume'
    | 'linkedin'
    | 'experience'
    | 'education'

export const PROFILE_EDIT_PARAM = 'edit'

// Targets that route to a different page entirely.
const EXTERNAL_HREFS: Partial<Record<string, string>> = {
    verification: '/profile/verify',
    calendar: '/settings/calendar',
}

export function profileEditHref(target: ProfileEditTarget | 'verification' | 'calendar'): string {
    const external = EXTERNAL_HREFS[target]
    if (external) return external
    return `/profile?${PROFILE_EDIT_PARAM}=${target}`
}

// Map a dashboard "missingFields" key to the right deep link.
// Keys here mirror the keys in the dashboard's completionFields array.
export function profileFieldToHref(fieldKey: string): string {
    switch (fieldKey) {
        case 'avatar_url':
            return profileEditHref('avatar')
        case 'industry':
        case 'industry_sector':
        case 'career_sectors':
            return profileEditHref('industry_sector')
        case 'resume_url':
            return profileEditHref('resume')
        case 'linkedin_url':
            return profileEditHref('linkedin')
        case 'school':
        case 'education':
            return profileEditHref('education')
        case 'sport':
        case 'experience':
            return profileEditHref('experience')
        default:
            return '/profile'
    }
}
