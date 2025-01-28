import React, {useState} from "react";
import {Fieldset, Label} from "@/components/fieldset";
import {Subheading} from "@/components/heading";

const SvgSelector = ({onSelect}: {onSelect: (url: string) => void}) => {
    const [svgContent, setSvgContent] = useState<string | null>(null); // SVG content from upload

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === "image/svg+xml") {
            const reader = new FileReader();
            reader.onload = () => {
                const content = (reader.result as string).trim();
                setSvgContent(content);
                onSelect(content);
            };
            reader.readAsText(file);
        } else {
            alert("Please upload a valid SVG file.");
        }
    };

    return (
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <Fieldset>
                <Label>Upload SVG</Label>
                <input
                    type="file"
                    accept=".svg"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border file:rounded-lg file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                />
            </Fieldset>

            {svgContent && (
                <div>
                    <Subheading>Preview</Subheading>
                    <div
                        className="mt-4 border rounded p-4 bg-gray-50 flex items-center justify-center overflow-hidden max-h-48 max-w-48">
                        <div
                            className="h-full w-auto object-contain"
                            dangerouslySetInnerHTML={{
                                __html: svgContent.replace(
                                    "<svg",
                                    `<svg style="width: 100%; height: 100%; object-fit: contain;"`
                                )
                            }}
                        />
                    </div>
                </div>
            )}
        </section>
    );
};

export default SvgSelector;
