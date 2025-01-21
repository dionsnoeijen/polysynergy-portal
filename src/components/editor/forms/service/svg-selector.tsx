import React, { useState, useEffect } from "react";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import Image from "next/image";

const SvgSelector = ({ onSelect }) => {
  const [svgs, setSvgs] = useState([]); // Loaded SVG icons
  const [loading, setLoading] = useState(false); // Loading state
  const [query, setQuery] = useState(""); // Search query
  const [page, setPage] = useState(1); // Pagination state
  const [customUrl, setCustomUrl] = useState(""); // Custom URL state
  const [hasMore, setHasMore] = useState(true); // Check if more pages are available

  const loadSvgs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.svgl.app/?limit=20&page=${page}&search=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSvgs((prev) => [...prev, ...data]);
      if (data.length === 0) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load SVGs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSvgs([]); // Reset icons on new search
    setPage(1);
    setHasMore(true);
  }, [query]);

  useEffect(() => {
    if (hasMore) loadSvgs();
  }, [page, query]);

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    if (bottom && !loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div>
      <Input
        placeholder="Search icons..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-2"
      />

      <div
        style={{ maxHeight: "200px", overflowY: "auto" }}
        onScroll={handleScroll}
        className="border rounded p-2"
      >
        {svgs.map((icon, index) => (
          <div
            key={index}
            onClick={() => onSelect(icon.route)}
            className="cursor-pointer hover:bg-gray-100 p-2"
          >
            <Image src={icon.route} alt={icon.title} className="inline-block w-6 h-6 mr-2" />
            {icon.title}
          </div>
        ))}

        {loading && <p className="text-center">Loading...</p>}
        {!hasMore && !loading && svgs.length === 0 && <p className="text-center">No icons found.</p>}
      </div>

      <div className="mt-4">
        <Input
          placeholder="Or enter your own SVG URL"
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
          className="mb-2"
        />
        <Button onClick={() => onSelect(customUrl)} disabled={!customUrl.trim()}>
          Use Custom SVG
        </Button>
      </div>
    </div>
  );
};

export default SvgSelector;
