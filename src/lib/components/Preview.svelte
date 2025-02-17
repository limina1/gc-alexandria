<script lang="ts">
  import { page } from "$app/state";
  import { pharosInstance, SiblingSearchDirection } from "$lib/parser";
  import { Button, ButtonGroup, CloseButton, Heading, Input, P, Textarea, Tooltip } from "flowbite-svelte";
  import { CaretDownSolid, CaretUpSolid, EditOutline } from "flowbite-svelte-icons";
  import { createEventDispatcher } from "svelte";

  // TODO: Fix move between parents.

  export let sectionClass: string = '';
  export let isSectionStart: boolean = false;
  export let rootId: string;
  export let parentId: string | null | undefined = null;
  export let depth: number = 0;
  export let allowEditing: boolean = false;
  export let needsUpdate: boolean = false;

  const dispatch = createEventDispatcher();

  let currentContent: string = $pharosInstance.getContent(rootId);
  let title: string | undefined = $pharosInstance.getIndexTitle(rootId);
  let orderedChildren: string[] = $pharosInstance.getOrderedChildIds(rootId);

  let isEditing: boolean = false;
  let hasCursor: boolean = false;
  let childHasCursor: boolean;

  let hasPreviousSibling: boolean = false;
  let hasNextSibling: boolean = false;

  let subtreeNeedsUpdate: boolean = false;
  let updateCount: number = 0;
  let subtreeUpdateCount: number = 0;

  $: buttonsVisible = hasCursor && !childHasCursor;

  $: {
    if (needsUpdate) {
      updateCount++;
      needsUpdate = false;
      title = $pharosInstance.getIndexTitle(rootId);
      currentContent = $pharosInstance.getContent(rootId);
    }

    if (subtreeNeedsUpdate) {
      subtreeUpdateCount++;
      subtreeNeedsUpdate = false;

      const prevChildCount = orderedChildren.length;
      orderedChildren = $pharosInstance.getOrderedChildIds(rootId);
      const newChildCount = orderedChildren.length;

      // If the number of children has changed, a child has been added or removed, and a child may
      // have been moved into a different subtree.  Due to the `needsUpdate` binding in the
      // component's recursion, setting `needsUpdate` to true will force the parent to rerender its
      // subtree.
      if (newChildCount !== prevChildCount) {
        needsUpdate = true;
      }
    }
  }

  $: {
    if (parentId && allowEditing) {
      // Check for previous/next siblings on load
      const previousSibling = $pharosInstance.getNearestSibling(rootId, depth - 1, SiblingSearchDirection.Previous);
      const nextSibling = $pharosInstance.getNearestSibling(rootId, depth - 1, SiblingSearchDirection.Next);
      
      // Hide arrows if no siblings exist
      hasPreviousSibling = !!previousSibling[0];
      hasNextSibling = !!nextSibling[0];
    }
  }

  const getHeadingTag = (depth: number) => {
    switch (depth) {
    case 0:
      return "h2";
    case 1:
      return "h3";
    case 2:
      return "h4";
    case 3:
      return "h5";
    case 4:
      return "h6";
    }
  };

  const handleMouseEnter = (e: MouseEvent) => {
    hasCursor = true;
    dispatch('cursorcapture', e);
  };

  const handleMouseLeave = (e: MouseEvent) => {
    hasCursor = false;
    dispatch('cursorrelease', e);
  };

  const handleChildCursorCaptured = (e: MouseEvent) => {
    childHasCursor = true;
    dispatch('cursorrelase', e);
  };

  const handleChildCursorReleased = (e: MouseEvent) => {
    childHasCursor = false;
  }

  const toggleEditing = (id: string, shouldSave: boolean = true) => {
    const editing = isEditing;

    if (editing && shouldSave) {
      if (orderedChildren.length > 0) {

      }

      $pharosInstance.updateEventContent(id, currentContent);
    }

    isEditing = !editing;
  };

  const moveUp = (rootId: string, parentId: string) => {
    // Get the previous sibling and its index
    const [prevSiblingId, prevIndex] = $pharosInstance.getNearestSibling(rootId, depth - 1, SiblingSearchDirection.Previous);
    if (!prevSiblingId || prevIndex == null) {
      return;
    }

    // Move the current event before the previous sibling.
    $pharosInstance.moveEvent(rootId, prevSiblingId, false);
    needsUpdate = true;
  };

  const moveDown = (rootId: string, parentId: string) => {
    // Get the next sibling and its index 
    const [nextSiblingId, nextIndex] = $pharosInstance.getNearestSibling(rootId, depth - 1, SiblingSearchDirection.Next);
    if (!nextSiblingId || nextIndex == null) {
      return;
    }

    // Move the current event after the next sibling
    $pharosInstance.moveEvent(rootId, nextSiblingId, true);
    needsUpdate = true;
  };
</script>

<!-- This component is recursively structured.  The base case is single block of content. -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<section
  id={rootId}
  class={`note-leather flex space-x-2 justify-between text-wrap break-words ${sectionClass}`}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  <!-- Zettel base case -->
  {#if orderedChildren.length === 0 || depth >= 4}
    {#key updateCount}
      {#if isEditing}
        <form class='w-full'>
          <Textarea class='textarea-leather w-full whitespace-normal' bind:value={currentContent}>
            <div slot='footer' class='flex space-x-2 justify-end'>
              <Button
                type='reset'
                class='btn-leather min-w-fit'
                size='sm'
                outline
                on:click={() => toggleEditing(rootId, false)}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                class='btn-leather min-w-fit'
                size='sm'
                on:click={() => toggleEditing(rootId, true)}
              >
                Save
              </Button>
            </div>
          </Textarea>
        </form>
      {:else}
        <P class='whitespace-normal' firstupper={isSectionStart}>
          {@html currentContent}
        </P>
      {/if}
    {/key}
  {:else}
    <div class='flex flex-col space-y-2 w-full'>
      {#if isEditing}
        <ButtonGroup class='w-full'>
          <Input type='text' class='input-leather' size='lg' bind:value={title}>
            <CloseButton slot='right' on:click={() => toggleEditing(rootId, false)} />
          </Input>
          <Button class='btn-leather' color='primary' size='lg' on:click={() => toggleEditing(rootId, true)}>
            Save
          </Button>
        </ButtonGroup>
      {:else}
        <Heading tag={getHeadingTag(depth)} class='h-leather'>
          {title}
        </Heading>
      {/if}
      <!-- Recurse on child indices and zettels -->
      {#key subtreeUpdateCount}
        {#each orderedChildren as id, index}
          <svelte:self
            rootId={id}
            parentId={rootId}
            depth={depth + 1}
            {allowEditing}
            isSectionStart={index === 0}
            bind:needsUpdate={subtreeNeedsUpdate}
            on:cursorcapture={handleChildCursorCaptured}
            on:cursorrelease={handleChildCursorReleased}
          />
        {/each}
      {/key}
    </div>
  {/if}
  {#if allowEditing && depth > 0}
    <div class={`flex flex-col space-y-2 justify-start ${buttonsVisible ? 'visible' : 'invisible'}`}>
      {#if hasPreviousSibling && parentId}
        <Button class='btn-leather' size='sm' outline on:click={() => moveUp(rootId, parentId)}>
          <CaretUpSolid />
        </Button>
      {/if}
      {#if hasNextSibling && parentId}
        <Button class='btn-leather' size='sm' outline on:click={() => moveDown(rootId, parentId)}>
          <CaretDownSolid />
        </Button>
      {/if}
      <Button class='btn-leather' size='sm' outline on:click={() => toggleEditing(rootId)}>
        <EditOutline />
      </Button>
      <Tooltip class='tooltip-leather' type='auto' placement='top'>
        Edit
      </Tooltip>
    </div>
  {/if}
</section>
