<script>
  import { toSecondsTimestamp } from '@helpers/helpers';
  import Select from 'svelte-select'

  let ms_value
  let q = ''
  export let items = []

  export let value = null

  $: {
    value = ms_value?.map(x => toSecondsTimestamp(Number(x.value))).filter(x=>x) || []
  }

  function handleFilter(e) {
    if (ms_value?.find(i => i.label === q)) return;

    if (e.detail.length === 0 && q.length > 0) {
      let newItems = [q].filter((x) => {
        let asNumber = Number(x)

        if (isNaN(asNumber)) return false // removing non-numbers
        if (asNumber % 1 !== 0) return false // removing floats

        return true
      })

      if (newItems.length) {
        items = newItems
      }
    }
  }
</script>

<p>q: {q}</p>
<p>v: {JSON.stringify(ms_value)}</p>
<p>o: {JSON.stringify(items)}</p>

<Select multiple {items} bind:filterText={q} bind:value={ms_value} on:filter={handleFilter} on:clear={handleFilter}></Select>