<script lang="ts">
  import { onMount } from 'svelte';

  let featureBlocks: HTMLElement[] = $state(new Array(56));

  function handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      } else {
        entry.target.classList.remove('animate-in');
      }
    });
  }

  onMount(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    featureBlocks.forEach((block) => {
      if (block) observer.observe(block);
    });

    return () => observer.disconnect();
  });
</script>

<div class="bg-white dark:bg-primary-1000">
  <main class="w-full">
    <!-- Hero Section -->
    <section class="relative section-leather overflow-hidden">
      <!-- Full-width Background with fade -->
      <div class="absolute inset-0 w-full bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-primary-950 dark:via-primary-1000 dark:to-primary-900"></div>
      <!-- Fade out gradient at bottom -->
      <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent dark:from-primary-1000"></div>
      <!-- Background Pattern -->
      <div class="absolute inset-0 w-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%230ea5e9%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      
      <div class="relative max-w-6xl mx-auto px-4 sm:px-6 md:px-8 text-center w-full">
        
        <h1 
          class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 dark:from-gray-100 dark:via-blue-300 dark:to-gray-100 bg-clip-text text-transparent leading-[1.2] mb-2 sm:mb-3 opacity-0 translate-y-8 py-2"
          bind:this={featureBlocks[18]}
          class:animate-in={featureBlocks[18]?.classList.contains('animate-in')}
        >
          Connecting Knowledge Seekers
        </h1>
        
        <p 
          class="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed font-light mb-2 sm:mb-3 opacity-0 translate-y-8"
          bind:this={featureBlocks[19]}
          class:animate-in={featureBlocks[19]?.classList.contains('animate-in')}
        >
          A decentralized home for scholarly ideas—connecting clinicians, researchers, students, and the public.
        </p>
        
        <p 
          class="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed font-light mb-3 sm:mb-4 opacity-0 translate-y-8"
          bind:this={featureBlocks[20]}
          class:animate-in={featureBlocks[20]?.classList.contains('animate-in')}
        >
          Plural perspectives, open discourse, and a transparent research process—brought together in one place.
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-6 justify-center items-center mb-0 pb-0 opacity-0 translate-y-8"
             bind:this={featureBlocks[21]}
             class:animate-in={featureBlocks[21]?.classList.contains('animate-in')}>
          <a 
            href="/getting-started" 
            class="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105"
            aria-label="Get Started with MedSchlr"
          >
            <span class="flex items-center">
              Get Started
              <svg class="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </span>
          </a>
          
          <a 
            href="/publications" 
            class="group px-8 py-4 bg-white text-blue-700 font-semibold rounded-2xl border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105"
            aria-label="Explore Publications"
          >
            <span class="flex items-center">
              Explore Publications
              <svg class="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
            </span>
          </a>
        </div>
      </div>
    </section>

    <!-- Why Choose MedSchlr Section -->
    <section id="why-choose" class="pt-0 pb-4 w-full bg-white dark:bg-primary-1000">
      <div class="max-w-6xl mx-auto px-6 md:px-8">
        <!-- Section Header -->
        <div class="text-center mb-12">
          <h2 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Why Choose MedSchlr?
          </h2>
        </div>

        <!-- Feature Grid - 3 boxes top row, 2 boxes bottom row -->
        <div class="flex flex-col items-center gap-8">
          <!-- Top Row - 3 boxes -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl">
            <!-- Global Collaboration -->
            <div 
              bind:this={featureBlocks[22]}
              class="group p-8 rounded-3xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:border-blue-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 hover:scale-105"
              class:animate-in={featureBlocks[22]?.classList.contains('animate-in')}
            >
              <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-4">
                Global Collaboration
              </h3>
              <p class="text-gray-800 leading-relaxed">
                Connect with scholars worldwide to share ideas, co-create studies, and find collaborators fast.
              </p>
            </div>

            <!-- Accessible Publishing -->
            <div 
              bind:this={featureBlocks[23]}
              class="group p-8 rounded-3xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:border-blue-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 hover:scale-105"
              class:animate-in={featureBlocks[23]?.classList.contains('animate-in')}
            >
              <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-4">
                Accessible Publishing
              </h3>
              <p class="text-gray-800 leading-relaxed">
                Publish openly and reach readers beyond paywalled journals with simple, transparent workflows.
              </p>
            </div>

            <!-- Interactive Tools -->
            <div 
              bind:this={featureBlocks[24]}
              class="group p-8 rounded-3xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:border-blue-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 hover:scale-105"
              class:animate-in={featureBlocks[24]?.classList.contains('animate-in')}
            >
              <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-4">
                Interactive Tools
              </h3>
              <p class="text-gray-800 leading-relaxed">
                Compose, visualize relationships, and explore evidence with intuitive, research-first tools.
              </p>
            </div>
          </div>
          
          <!-- Bottom Row - 2 boxes centered -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            <!-- Community Growth -->
            <div 
              bind:this={featureBlocks[25]}
              class="group p-8 rounded-3xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:border-blue-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 hover:scale-105"
              class:animate-in={featureBlocks[25]?.classList.contains('animate-in')}
            >
              <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-4">
                Community Growth
              </h3>
              <p class="text-gray-800 leading-relaxed">
                Join communities across basic and clinical science to exchange methods, guidelines, and evidence synthesis. Comment on others' work and build meaningful academic discussions.
              </p>
            </div>
            
            <!-- Crowdfunded Support -->
            <div 
              bind:this={featureBlocks[26]}
              class="group p-8 rounded-3xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:border-blue-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 hover:scale-105"
              class:animate-in={featureBlocks[26]?.classList.contains('animate-in')}
            >
              <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-4">
                Crowdfunded Support
              </h3>
              <p class="text-gray-800 leading-relaxed">
                Empower scholars directly with micro-funding. Send or receive Lightning zaps to back promising ideas, pilot projects, and ongoing research without gatekeepers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stakeholder Cards Section -->
    <section class="py-16 sm:py-20 lg:py-24 w-full bg-gradient-to-br from-gray-50 to-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <!-- Section Header -->
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Built for Every Scholar
          </h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            MedSchlr adapts to your role, providing tailored tools and experiences for every type of knowledge seeker.
          </p>
        </div>
        
        <!-- Stakeholder Cards - 2x2 grid on desktop, 2 per row on tablet, single column on mobile -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <!-- Clinicians Card -->
          <div 
            class="group relative bg-white border border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:border-blue-300 hover:-translate-y-2 focus-within:ring-4 focus-within:ring-blue-200 focus-within:ring-offset-2 transition-all duration-500 cursor-pointer overflow-hidden"
            role="button"
            tabindex="0"
            aria-label="Clinicians: Connect with peers internationally and brainstorm new research"
            onclick={() => window.location.href = '/stakeholders/clinicians'}
            onkeydown={(e) => e.key === 'Enter' && (window.location.href = '/stakeholders/clinicians')}
          >
            <!-- Background Gradient -->
            <div class="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <!-- Icon -->
            <div class="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
                  </div>
            
            <!-- Content -->
            <div class="relative">
              <h3 class="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-700 transition-colors duration-300">
                Clinicians
              </h3>
              <p class="text-gray-700 leading-relaxed mb-6 text-lg">
                Skim concise evidence syntheses and link back to source notes at the point of care.
              </p>
              <div class="flex items-center text-blue-600 group-hover:text-blue-700 font-semibold">
                <span>See how it helps</span>
                <svg class="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <!-- Researchers Card -->
          <div 
            class="group relative bg-white border border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:border-blue-300 hover:-translate-y-2 focus-within:ring-4 focus-within:ring-blue-200 focus-within:ring-offset-2 transition-all duration-500 cursor-pointer overflow-hidden"
            role="button"
            tabindex="0"
            aria-label="Researchers: Publish findings and discover cutting-edge research"
            onclick={() => window.location.href = '/stakeholders/researchers'}
            onkeydown={(e) => e.key === 'Enter' && (window.location.href = '/stakeholders/researchers')}
          >
            <!-- Background Gradient -->
            <div class="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <!-- Icon -->
            <div class="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
                  </div>
            
            <!-- Content -->
            <div class="relative">
              <h3 class="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-700 transition-colors duration-300">
                Researchers
              </h3>
              <p class="text-gray-700 leading-relaxed mb-6 text-lg">
                Share early ideas, get open feedback, and build living evidence syntheses.
              </p>
              <div class="flex items-center text-blue-600 group-hover:text-blue-700 font-semibold">
                <span>See how it helps</span>
                <svg class="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <!-- Students Card -->
          <div 
            class="group relative bg-white border border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:border-blue-300 hover:-translate-y-2 focus-within:ring-4 focus-within:ring-blue-200 focus-within:ring-offset-2 transition-all duration-500 cursor-pointer overflow-hidden"
            role="button"
            tabindex="0"
            aria-label="Students: Learn, collaborate, and gain exposure to scholarly publishing"
            onclick={() => window.location.href = '/stakeholders/students'}
            onkeydown={(e) => e.key === 'Enter' && (window.location.href = '/stakeholders/students')}
          >
            <!-- Background Gradient -->
            <div class="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <!-- Icon -->
            <div class="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
                  </div>
            
            <!-- Content -->
            <div class="relative">
              <h3 class="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-700 transition-colors duration-300">
                Students
              </h3>
              <p class="text-gray-700 leading-relaxed mb-6 text-lg">
                Publish notes and micro-articles; grow a visible, citable learning trail.
              </p>
              <div class="flex items-center text-blue-600 group-hover:text-blue-700 font-semibold">
                <span>See how it helps</span>
                <svg class="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <!-- Public/Health Advocates Card -->
          <div 
            class="group relative bg-white border border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:border-blue-300 hover:-translate-y-2 focus-within:ring-4 focus-within:ring-blue-200 focus-within:ring-offset-2 transition-all duration-500 cursor-pointer overflow-hidden"
            role="button"
            tabindex="0"
            aria-label="Public and Health Advocates: Access research and contribute to public health discussions"
            onclick={() => window.location.href = '/stakeholders/public'}
            onkeydown={(e) => e.key === 'Enter' && (window.location.href = '/stakeholders/public')}
          >
            <!-- Background Gradient -->
            <div class="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <!-- Icon -->
            <div class="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
                  </div>
            
            <!-- Content -->
            <div class="relative">
              <h3 class="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-700 transition-colors duration-300">
                Public & Health Advocates
              </h3>
              <p class="text-gray-700 leading-relaxed mb-6 text-lg">
                Read beyond paywalls, follow threads, and fund work you value.
              </p>
              <div class="flex items-center text-blue-600 group-hover:text-blue-700 font-semibold">
                <span>See how it helps</span>
                <svg class="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Filler Images Section -->
    <section class="py-12 w-full bg-white">
      <div class="max-w-4xl mx-auto px-6 md:px-8">
        <div class="flex justify-center items-center gap-4">
          <!-- Image 1 -->
          <div 
            class="w-24 h-24 bg-gray-200 rounded-lg shadow-md flex items-center justify-center opacity-0 translate-y-8"
            bind:this={featureBlocks[24]}
            class:animate-in={featureBlocks[24]?.classList.contains('animate-in')}
          >
            <svg class="w-12 h-12 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          
          <!-- Image 2 -->
          <div 
            class="w-24 h-24 bg-gray-200 rounded-lg shadow-md flex items-center justify-center opacity-0 translate-y-8"
            bind:this={featureBlocks[25]}
            class:animate-in={featureBlocks[25]?.classList.contains('animate-in')}
          >
            <svg class="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          
          <!-- Image 3 -->
          <div 
            class="w-24 h-24 bg-gray-200 rounded-lg shadow-md flex items-center justify-center opacity-0 translate-y-8"
            bind:this={featureBlocks[27]}
            class:animate-in={featureBlocks[27]?.classList.contains('animate-in')}
          >
            <svg class="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          
          <!-- Image 4 -->
          <div 
            class="w-24 h-24 bg-gray-200 rounded-lg shadow-md flex items-center justify-center opacity-0 translate-y-8"
            bind:this={featureBlocks[28]}
            class:animate-in={featureBlocks[28]?.classList.contains('animate-in')}
          >
            <svg class="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </div>
          
          <!-- Image 5 -->
          <div 
            class="w-24 h-24 bg-gray-200 rounded-lg shadow-md flex items-center justify-center opacity-0 translate-y-8"
            bind:this={featureBlocks[29]}
            class:animate-in={featureBlocks[29]?.classList.contains('animate-in')}
          >
            <svg class="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
        </div>
      </div>
    </section>


    <!-- Featured Publications Section -->
    <section id="featured-publications" class="py-20 w-full bg-white">
      <div class="max-w-6xl mx-auto px-6 md:px-8">
        <!-- Section Header -->
        <div 
          class="text-center mb-16 opacity-0 translate-y-8"
          bind:this={featureBlocks[30]}
          class:animate-in={featureBlocks[30]?.classList.contains('animate-in')}
        >
          <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Featured Publications
          </h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            A snapshot of recent and notable work shared on MedSchlr.
          </p>
        </div>

        <!-- Filter Row -->
        <div class="flex flex-wrap justify-center gap-3 mb-12">
          {#each ['All', 'Cardiology', 'Oncology', 'Neuroscience', 'Public Health', 'AI in Medicine'] as filter, index}
            <button
              class="px-4 py-2 rounded-full border border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm font-medium text-blue-800"
              class:bg-blue-100={filter === 'All'}
              class:border-blue-300={filter === 'All'}
              style="opacity: 0; transform: translateY(20px); transition-delay: {index * 50}ms;"
              bind:this={featureBlocks[32 + index]}
              class:animate-in={featureBlocks[32 + index]?.classList.contains('animate-in')}
            >
              {filter}
            </button>
          {/each}
        </div>

        <!-- Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {#each [
            {
              title: "Novel Approaches to Cardiac Regeneration in Post-MI Patients",
              authors: "Dr. Sarah Chen, Dr. Michael Rodriguez",
              tags: ["peer-reviewed", "open data", "relay-synced"],
              date: "Dec 2024",
              readTime: "8 min read"
            },
            {
              title: "Machine Learning Applications in Early Cancer Detection",
              authors: "Dr. James Wilson, Dr. Emily Park",
              tags: ["peer-reviewed", "AI/ML", "relay-synced"],
              date: "Dec 2024",
              readTime: "12 min read"
            },
            {
              title: "The Impact of Social Determinants on Health Outcomes",
              authors: "Dr. Maria Garcia, Dr. David Thompson",
              tags: ["public health", "research", "relay-synced"],
              date: "Nov 2024",
              readTime: "6 min read"
            },
            {
              title: "Advances in Neuromodulation for Chronic Pain",
              authors: "Dr. Robert Kim, Dr. Lisa Chen",
              tags: ["peer-reviewed", "clinical", "relay-synced"],
              date: "Nov 2024",
              readTime: "10 min read"
            },
            {
              title: "Digital Health Interventions in Rural Communities",
              authors: "Dr. Amanda Foster, Dr. Carlos Mendez",
              tags: ["public health", "digital health", "relay-synced"],
              date: "Oct 2024",
              readTime: "7 min read"
            },
            {
              title: "Ethical Considerations in AI-Driven Diagnostics",
              authors: "Dr. Jennifer Lee, Dr. Thomas Brown",
              tags: ["AI/ML", "ethics", "relay-synced"],
              date: "Oct 2024",
              readTime: "9 min read"
            }
          ] as publication, index}
            <div 
              class="group bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 shadow-md hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 transition-all duration-300 cursor-pointer"
              style="opacity: 0; transform: translateY(30px); transition-delay: {index * 80}ms;"
              bind:this={featureBlocks[38 + index]}
              class:animate-in={featureBlocks[38 + index]?.classList.contains('animate-in')}
              role="button"
              tabindex="0"
              onclick={() => window.location.href = `/publications`}
              onkeydown={(e) => e.key === 'Enter' && (window.location.href = `/publications`)}
            >
              <h3 class="text-lg font-bold text-gray-900 mb-3 line-clamp-2 leading-tight">
                {publication.title}
              </h3>
              <p class="text-sm text-gray-600 mb-4">
                {publication.authors}
              </p>
              <div class="flex flex-wrap gap-2 mb-4">
                {#each publication.tags as tag}
                  <span class="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                    {tag}
                  </span>
                {/each}
              </div>
              <div class="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>{publication.date}</span>
                <span class="flex items-center gap-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                  </svg>
                  Relay-Synced
                </span>
                <span>{publication.readTime}</span>
              </div>
              <div class="text-right">
                <span class="text-blue-600 hover:text-blue-800 font-medium text-sm group-hover:underline transition-colors duration-200">
                  Read more →
                </span>
              </div>
            </div>
          {/each}
        </div>

        <!-- Footer CTA -->
        <div 
          class="text-center"
          style="opacity: 0; transform: translateY(20px);"
          bind:this={featureBlocks[43]}
          class:animate-in={featureBlocks[43]?.classList.contains('animate-in')}
        >
          <a 
            href="/publications" 
            class="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300"
          >
            View All Publications
          </a>
        </div>
      </div>
    </section>

      <!-- Communities Section -->
      <section id="communities" class="py-6 w-full bg-white dark:bg-primary-1000">
        <div class="max-w-6xl mx-auto px-6 md:px-8">
          <!-- Garden Metaphor -->
          <div class="text-center mb-2">
            <p 
              class="text-lg text-gray-500 italic max-w-2xl mx-auto leading-relaxed opacity-0 translate-y-8"
              bind:this={featureBlocks[44]}
              class:animate-in={featureBlocks[44]?.classList.contains('animate-in')}
            >
              A garden for ideas—where diverse perspectives can take root and grow.
            </p>
          </div>
          
          <!-- Section Header -->
          <div class="text-center mb-6">
            <h2 
              class="text-4xl md:text-5xl font-bold text-gray-900 mb-3 opacity-0 translate-y-8"
              bind:this={featureBlocks[45]}
              class:animate-in={featureBlocks[45]?.classList.contains('animate-in')}
            >
              Communities
            </h2>
            <p 
              class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed opacity-0 translate-y-8"
              bind:this={featureBlocks[46]}
              class:animate-in={featureBlocks[46]?.classList.contains('animate-in')}
            >
              Join focused communities to collaborate, share resources, and exchange ideas.
            </p>
          </div>

          <!-- Communities Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Basic Research -->
            <div 
              class="opacity-0 translate-y-8"
              bind:this={featureBlocks[47]}
              class:animate-in={featureBlocks[47]?.classList.contains('animate-in')}
            >
              <h3 class="text-2xl font-bold text-gray-900 mb-4">Basic Research</h3>
              <div class="flex flex-wrap gap-3">
                <a 
                  href="/communities/lab-methods"
                  class="px-6 py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300"
                  aria-label="Join Lab Methods community"
                >
                  Lab Methods
                </a>
                <a 
                  href="/communities/genetics"
                  class="px-6 py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300"
                  aria-label="Join Genetics community"
                >
                  Genetics
                </a>
                <a 
                  href="/communities/animal-studies"
                  class="px-6 py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300"
                  aria-label="Join Animal Studies community"
                >
                  Animal Studies
                </a>
              </div>
            </div>

            <!-- Clinical Research -->
            <div 
              class="opacity-0 translate-y-8"
              bind:this={featureBlocks[47]}
              class:animate-in={featureBlocks[47]?.classList.contains('animate-in')}
            >
              <h3 class="text-2xl font-bold text-gray-900 mb-4">Clinical Research</h3>
              <div class="flex flex-wrap gap-3">
                <a 
                  href="/communities/guideline-development"
                  class="px-6 py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300"
                  aria-label="Join Guideline Development community"
                >
                  Guideline Development
                </a>
                <a 
                  href="/communities/systematic-reviews"
                  class="px-6 py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300"
                  aria-label="Join Systematic Reviews community"
                >
                  Systematic Reviews
                </a>
                <a 
                  href="/communities/patient-outcomes"
                  class="px-6 py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300"
                  aria-label="Join Patient Outcomes community"
                >
                  Patient Outcomes
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section id="how-it-works" class="pt-2 pb-4 bg-white dark:bg-primary-1000">
        <div class="max-w-4xl mx-auto px-6 md:px-8">
          <!-- Section Header -->
          <div class="text-center mb-3">
            <h2 
              class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-2 opacity-0 translate-y-8"
              bind:this={featureBlocks[48]}
              class:animate-in={featureBlocks[48]?.classList.contains('animate-in')}
            >
              How It Works
            </h2>
            <p 
              class="text-lg text-gray-600 max-w-2xl mx-auto opacity-0 translate-y-8"
              bind:this={featureBlocks[45]}
              class:animate-in={featureBlocks[45]?.classList.contains('animate-in')}
            >
              Get started with MedSchlr in just a few simple steps.
            </p>
          </div>

          <!-- Step Cards -->
          <div class="space-y-6 max-w-2xl mx-auto">
            <!-- Step 1: Create Account -->
            <div 
                              class="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 py-2 px-4 border border-gray-100 opacity-0 translate-y-8"
              bind:this={featureBlocks[46]}
              class:animate-in={featureBlocks[46]?.classList.contains('animate-in')}
            >
              <div class="flex items-center gap-4 pt-1">
                <div class="flex-shrink-0">
                                      <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span class="text-white font-bold text-base" aria-label="Step 1: Create Account">1</span>
                  </div>
                </div>
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-900 mb-1">Create Account</h3>
                  <p class="text-neutral-600 text-sm">Generate your Nostr key pair and secure your decentralized identity.</p>
                </div>
              </div>
            </div>

            <!-- Step 2: Log In -->
            <div 
                              class="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 py-2 px-4 border border-gray-100 opacity-0 translate-y-8"
              bind:this={featureBlocks[47]}
              class:animate-in={featureBlocks[47]?.classList.contains('animate-in')}
            >
              <div class="flex items-center gap-4 pt-1">
                <div class="flex-shrink-0">
                                      <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span class="text-white font-bold text-base" aria-label="Step 2: Log In">2</span>
                  </div>
                </div>
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-900 mb-1">Log In</h3>
                  <p class="text-neutral-600 text-sm">Connect with your private key or Nostr extension.</p>
                </div>
              </div>
            </div>

            <!-- Step 3: Connect to MedSchlr -->
            <div 
                              class="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 py-2 px-4 border border-gray-100 opacity-0 translate-y-8"
              bind:this={featureBlocks[48]}
              class:animate-in={featureBlocks[48]?.classList.contains('animate-in')}
            >
              <div class="flex items-center gap-4 pt-1">
                <div class="flex-shrink-0">
                                      <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span class="text-white font-bold text-base" aria-label="Step 3: Connect to MedSchlr">3</span>
                  </div>
                </div>
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-900 mb-1">Connect to MedSchlr</h3>
                    <p class="text-gray-600 text-sm mb-2">Connection is automatic—no technical setup required.</p>
                  <a 
                    href="/settings/relays" 
                                          class="text-blue-600 hover:text-blue-800 text-xs underline transition-colors duration-200"
                    aria-label="View advanced relay settings"
                  >
                    Advanced settings
                  </a>
                </div>
              </div>
            </div>

            <!-- Step 4: Explore & Publish -->
            <div 
                              class="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 py-2 px-4 border border-gray-100 opacity-0 translate-y-8"
              bind:this={featureBlocks[49]}
              class:animate-in={featureBlocks[49]?.classList.contains('animate-in')}
            >
              <div class="flex items-center gap-4 pt-1">
                <div class="flex-shrink-0">
                                      <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span class="text-white font-bold text-base" aria-label="Step 4: Explore & Publish">4</span>
                  </div>
                </div>
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-900 mb-1">Explore & Publish</h3>
                  <p class="text-neutral-600 text-sm">Browse research, publish your work, and collaborate with others.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Call to Action Section -->
      <section id="cta-section" class="py-20 w-full bg-white dark:bg-primary-1000">
        <div class="max-w-4xl mx-auto px-6 md:px-8 text-center">
          <!-- Headline -->
          <h2 
            class="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-gray-100 mb-6 opacity-0 translate-y-8"
            bind:this={featureBlocks[50]}
            class:animate-in={featureBlocks[50]?.classList.contains('animate-in')}
          >
            Ready to Join the Future of Scholarly Publishing?
          </h2>
          
          <!-- Subtitle -->
          <p 
            class="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed mb-12 opacity-0 translate-y-8"
            bind:this={featureBlocks[51]}
            class:animate-in={featureBlocks[51]?.classList.contains('animate-in')}
          >
            Start your journey with MedSchlr today and become part of the decentralized academic revolution.
          </p>
          
          <!-- CTA Button -->
          <div 
            class="opacity-0 translate-y-8"
            bind:this={featureBlocks[52]}
            class:animate-in={featureBlocks[52]?.classList.contains('animate-in')}
          >
            <a 
              href="/getting-started"
              class="px-10 py-5 bg-blue-600 text-white font-semibold text-lg md:text-xl rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105"
              aria-label="Get Started with MedSchlr"
            >
              Get Started
            </a>
          </div>
        </div>
      </section>
  </main>
</div>

<style>
  /* Add smooth transitions for all animated elements */
  [class*="opacity-0"], [class*="translate-y-8"] {
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  }
  
  .animate-in {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
  
  /* Ensure sections stack vertically */
  main > section {
    display: block !important;
    width: 100% !important;
    float: none !important;
    clear: both !important;
  }
  
  /* Force vertical layout */
  main {
    display: flex !important;
    flex-direction: column !important;
  }
</style>



