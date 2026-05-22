import { readFileSync } from "node:fs";
import { join } from "node:path";

type GalleryPage = {
  page: number;
  src: string;
};

type GalleryGroup = {
  id: string;
  title: string;
  description?: string;
  base: string;
  updatedAt: string;
  pdf: string | null;
  pages: GalleryPage[];
};

type Manifest = {
  generatedAt: string;
  sourceDir: string;
  groups: GalleryGroup[];
};

function loadManifest(): Manifest {
  const path = join(process.cwd(), "public", "dev", "qa-gallery", "manifest.json");
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {
      generatedAt: "",
      sourceDir: "experiments/idml-recon",
      groups: [],
    };
  }
}

function formatDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function QaGalleryPage() {
  const manifest = loadManifest();
  const latest = manifest.groups[0];
  const history = manifest.groups.slice(1);

  return (
    <main style={{ minHeight: "100vh", background: "#f2f2ef", color: "#202124" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: "1px solid #d8d6d0",
          background: "rgba(247, 246, 242, 0.96)",
          padding: "16px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1800,
            margin: "0 auto",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 650, margin: 0 }}>Sungjin QA Gallery</h1>
            <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>
              Local review wall for Typst PDF/PNG samples
            </p>
          </div>
          <div style={{ color: "#777", fontSize: 12, textAlign: "right" }}>
            <div>source: {manifest.sourceDir}</div>
            {manifest.generatedAt ? <div>synced: {formatDate(manifest.generatedAt)}</div> : null}
          </div>
        </div>
      </header>

      <section style={{ maxWidth: 1800, margin: "0 auto", padding: 24 }}>
        {manifest.groups.length === 0 ? (
          <div
            style={{
              background: "#fff",
              border: "1px dashed #bbb",
              color: "#555",
              fontSize: 14,
              padding: 32,
            }}
          >
            No samples yet. Run `cd web; npm.cmd run sync-qa-gallery` first.
          </div>
        ) : latest ? (
          <div style={{ display: "grid", gap: 28 }}>
            <article style={{ background: "#fff", border: "1px solid #d8d6d0" }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  borderBottom: "1px solid #e4e1da",
                  padding: "16px 20px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        background: "#0091db",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "3px 7px",
                      }}
                    >
                      LATEST
                    </span>
                    <h2 style={{ fontSize: 18, fontWeight: 650, margin: 0 }}>{latest.title}</h2>
                  </div>
                  {latest.description ? (
                    <p style={{ margin: "8px 0 0", color: "#444", fontSize: 14 }}>
                      {latest.description}
                    </p>
                  ) : null}
                  <p style={{ margin: "4px 0 0", color: "#777", fontSize: 12 }}>
                    {latest.base} / {formatDate(latest.updatedAt)}
                  </p>
                </div>
                {latest.pdf ? (
                  <a
                    href={latest.pdf}
                    target="_blank"
                    style={{
                      border: "1px solid #222",
                      color: "#222",
                      display: "inline-block",
                      fontSize: 14,
                      padding: "8px 12px",
                      textDecoration: "none",
                    }}
                  >
                    Open PDF
                  </a>
                ) : null}
              </div>

              <div
                style={{
                  background: "#ecebe7",
                  display: "grid",
                  gap: 20,
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  padding: 20,
                }}
              >
                {latest.pages.map((page) => (
                  <figure key={page.src} style={{ background: "#d7d5ce", margin: 0, padding: 12 }}>
                    <figcaption
                      style={{
                        color: "#555",
                        display: "flex",
                        fontSize: 12,
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <span>p{page.page}</span>
                      <a href={page.src} target="_blank">
                        Open PNG
                      </a>
                    </figcaption>
                    <img
                      src={page.src}
                      alt={`${latest.title} p${page.page}`}
                      style={{
                        background: "#fff",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                        display: "block",
                        width: "100%",
                      }}
                    />
                  </figure>
                ))}
              </div>
            </article>

            {history.length > 0 ? (
              <section
                style={{
                  background: "#faf9f5",
                  border: "1px solid #d8d6d0",
                  padding: 16,
                }}
              >
                <div
                  style={{
                    alignItems: "baseline",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <h2 style={{ color: "#333", fontSize: 15, fontWeight: 650, margin: 0 }}>
                    Previous records
                  </h2>
                  <span style={{ color: "#777", fontSize: 12 }}>{history.length} items</span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  }}
                >
                  {history.map((group, index) => {
                    return (
                      <article
                        key={group.id}
                        style={{
                          background: "#fff",
                          border: "1px solid #e0ded7",
                          overflow: "hidden",
                        }}
                      >
                        <div style={{ padding: 10 }}>
                          <div
                            style={{
                              alignItems: "center",
                              display: "flex",
                              gap: 6,
                              marginBottom: 4,
                            }}
                          >
                            <span
                              style={{
                                background: "#e1dfd8",
                                color: "#666",
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "2px 5px",
                              }}
                            >
                              #{index + 2}
                            </span>
                            <h3
                              style={{
                                color: "#333",
                                fontSize: 13,
                                fontWeight: 650,
                                lineHeight: 1.3,
                                margin: 0,
                              }}
                            >
                              {group.title}
                            </h3>
                          </div>
                          <p
                            style={{
                              color: "#777",
                              fontSize: 11,
                              lineHeight: 1.35,
                              margin: "0 0 8px",
                            }}
                          >
                            {group.base} / {group.pages.length} page
                            {group.pages.length === 1 ? "" : "s"}
                          </p>
                          {group.pages.length > 0 ? (
                            <div
                              style={{
                                display: "grid",
                                gap: 6,
                                gridTemplateColumns: "repeat(auto-fill, minmax(54px, 1fr))",
                                marginBottom: 8,
                              }}
                            >
                              {group.pages.map((page) => (
                                <a
                                  key={page.src}
                                  href={page.src}
                                  target="_blank"
                                  title={`${group.title} p${page.page}`}
                                  style={{
                                    background: "#e8e6df",
                                    border: "1px solid #e0ded7",
                                    display: "block",
                                    height: 78,
                                    overflow: "hidden",
                                    position: "relative",
                                  }}
                                >
                                  <img
                                    src={page.src}
                                    alt={`${group.title} p${page.page}`}
                                    style={{
                                      display: "block",
                                      height: "100%",
                                      objectFit: "cover",
                                      objectPosition: "top center",
                                      width: "100%",
                                    }}
                                  />
                                  <span
                                    style={{
                                      background: "rgba(255,255,255,0.86)",
                                      bottom: 2,
                                      color: "#555",
                                      fontSize: 10,
                                      padding: "1px 3px",
                                      position: "absolute",
                                      right: 2,
                                    }}
                                  >
                                    p{page.page}
                                  </span>
                                </a>
                              ))}
                            </div>
                          ) : null}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {group.pdf ? (
                              <a href={group.pdf} target="_blank" style={{ fontSize: 12 }}>
                                PDF
                              </a>
                            ) : null}
                            {group.pages.map((page) => (
                              <a key={page.src} href={page.src} target="_blank" style={{ fontSize: 12 }}>
                                p{page.page}
                              </a>
                            ))}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 40 }}>
            {manifest.groups.map((group, index) => (
              <article
                key={group.id}
                style={{ background: "#fff", border: "1px solid #d8d6d0" }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    borderBottom: "1px solid #e4e1da",
                    padding: "16px 20px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          background: index === 0 ? "#0091db" : "#e1dfd8",
                          color: index === 0 ? "#fff" : "#555",
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "3px 7px",
                        }}
                      >
                        {index === 0 ? "LATEST" : `#${index + 1}`}
                      </span>
                      <h2 style={{ fontSize: 18, fontWeight: 650, margin: 0 }}>{group.title}</h2>
                    </div>
                    {group.description ? (
                      <p style={{ margin: "8px 0 0", color: "#444", fontSize: 14 }}>
                        {group.description}
                      </p>
                    ) : null}
                    <p style={{ margin: "4px 0 0", color: "#777", fontSize: 12 }}>
                      {group.base} / {formatDate(group.updatedAt)}
                    </p>
                  </div>
                  {group.pdf ? (
                    <a
                      href={group.pdf}
                      target="_blank"
                      style={{
                        border: "1px solid #222",
                        color: "#222",
                        display: "inline-block",
                        fontSize: 14,
                        padding: "8px 12px",
                        textDecoration: "none",
                      }}
                    >
                      Open PDF
                    </a>
                  ) : null}
                </div>

                <div
                  style={{
                    background: "#ecebe7",
                    display: "grid",
                    gap: 20,
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    padding: 20,
                  }}
                >
                  {group.pages.map((page) => (
                    <figure
                      key={page.src}
                      style={{ background: "#d7d5ce", margin: 0, padding: 12 }}
                    >
                      <figcaption
                        style={{
                          color: "#555",
                          display: "flex",
                          fontSize: 12,
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <span>p{page.page}</span>
                        <a href={page.src} target="_blank">
                          Open PNG
                        </a>
                      </figcaption>
                      <img
                        src={page.src}
                        alt={`${group.title} p${page.page}`}
                        style={{
                          background: "#fff",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                          display: "block",
                          width: "100%",
                        }}
                      />
                    </figure>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
