# AM BadgeScript

A lightweight JavaScript library for displaying verified badges on websites. This script integrates with Supabase to verify and display badges based on page URLs and identifiers.

## Installation

Add the following script tag to your HTML:

```html
<script 
  src="https://[YOUR-PROJECT-REF].supabase.co/functions/v1/badge-script" 
  data-identifier="YOUR-IDENTIFIER">
</script>
```

Add a container div where you want the badge to appear:

```html
<div data-verified-badge></div>
```

## Configuration

- `data-identifier`: Required attribute that uniquely identifies your site/application
- The badge will automatically verify against the current page URL

## Development

1. Clone the repository
2. Install dependencies (if any)
3. Make your changes
4. Test locally
5. Deploy to your Supabase project

## License

MIT 