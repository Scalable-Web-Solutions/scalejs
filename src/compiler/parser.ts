export type Prop = {name: string; defaultVal: string | undefined };

export function parseScale(src: string)
{
    // find script tag and style tag from input stream
    const matchScriptTag = src.match(/<script>([\s\S]*?)<\/script>/i)
    const matchStyleTag = src.match(/<style>([\s\S]*?)<\/style>/i)

    // get details from inside the tags
    const script = matchScriptTag?.[1]?.trim() ?? '';
    const style = matchStyleTag?.[1]?.trim() ?? '';

    let template = src.replace(/<script>([\s\S]*?)<\/script>/i, '').replace(/<style>([\s\S]*?)<\/style>/i, '').trim();

    // get props like export let title = "xyz";

    // define props structure and valid declarations
    const props: Prop[] = [];
    const re = /export\s+let\s+([A-Za-z_][A-Za-z0-9_]*)(\s*=\s*([^;]+))?;/g;

    // Iterate through our input stream to see if any lines match our props regex
    for (const m of src.matchAll(re))
    {
        const name = m[1];
        const def = m[3]?.trim();
        props.push({ name, defaultVal: def });
    }

    // return filtered shi
    return { script, style, template, props };
}