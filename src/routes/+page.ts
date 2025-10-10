import type { PageLoad } from './$types';
import NDK, { NDKEvent, NDKRelaySet } from '@nostr-dev-kit/ndk';
import { indexKind } from '$lib/consts';

/**
 * Fetches featured 30040 (index) events from the medschlr relay
 * Showcases the Community Charter as the first article, followed by 5 recent publications
 * @returns Object with publications array
 */
export const load: PageLoad = async () => {
    try {
        // Create a temporary NDK instance for server-side data fetching
        const ndk = new NDK({
            explicitRelayUrls: ['wss://medschlr.nostr1.com'],
            enableOutboxModel: false,
        });

        await ndk.connect();

        // AI-NOTE: Showcase the Community Charter as the first featured article
        const SHOWCASED_DTAG = 'medschlr-community-charter-v1-0';

        // Fetch the showcased charter article specifically
        const charterEvents = await ndk.fetchEvents(
            {
                kinds: [indexKind],
                '#d': [SHOWCASED_DTAG],
                limit: 1,
            },
            {
                groupable: true,
                closeOnEose: true,
            }
        );

        // Fetch 6 most recent publications
        const recentEvents = await ndk.fetchEvents(
            {
                kinds: [indexKind],
                limit: 6,
            },
            {
                groupable: true,
                closeOnEose: true,
            }
        );

        // Helper function to map event to publication object
        const mapEventToPublication = (event: NDKEvent) => ({
            id: event.id,
            pubkey: event.pubkey,
            kind: event.kind,
            created_at: event.created_at,
            content: event.content,
            tags: event.tags,
            // Extract commonly used tag values
            title: event.getMatchingTags('title')[0]?.[1] || 'Untitled',
            summary: event.getMatchingTags('summary')[0]?.[1] || '',
            dTag: event.getMatchingTags('d')[0]?.[1] || '',
            image: event.getMatchingTags('image')[0]?.[1] || '',
            publishedAt: event.getMatchingTags('published_at')[0]?.[1] || '',
        });

        const publications = [];

        // Add charter as first publication if found
        const charterEvent = Array.from(charterEvents)[0];
        if (charterEvent) {
            publications.push(mapEventToPublication(charterEvent));
        }

        // Add up to 5 other recent publications (excluding charter to avoid duplicate)
        const otherPublications = Array.from(recentEvents)
            .filter((event) => {
                const dTag = event.getMatchingTags('d')[0]?.[1];
                return dTag !== SHOWCASED_DTAG;
            })
            .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
            .slice(0, 5)
            .map(mapEventToPublication);

        publications.push(...otherPublications);

        console.log(`[Landingpage] Fetched ${publications.length} publications (charter showcased first)`);

        return {
            publications,
        };
    } catch (error) {
        console.error('[Landingpage] Error fetching publications:', error);
        // Return empty array on error
        return {
            publications: [],
        };
    }
};
