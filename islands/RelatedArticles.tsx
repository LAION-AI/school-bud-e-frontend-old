export default function RelatedArticles({relatedArticles: articles, ...params}: { count: number, offset?: number, size?: 'large' | 'small', relatedArticles: Article[] }) {
    if (articles.length === 0) {
        return (<div className="group cursor-pointer">
            <div className=" overflow-hidden rounded-md bg-gray-100 transition-all hover:scale-105">
                <a
                    className="relative block aspect-video"
                    href="/article"
                >
                    <img
                        alt="Thumbnail"
                        fetchpriority="high"
                        decoding="async"
                        data-nimg="fill"
                        className="object-cover transition-all"
                        style={{
                            position: "absolute",
                            height: "100%",
                            width: "100%",
                            inset: 0,
                            color: "transparent"
                        }}
                        sizes="(max-width: 768px) 30vw, 33vw"
                        srcSet="/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F05951a0ec1a6ffc54f615ab160649e92fea982d0-800x764.png%3Frect%3D0%2C0%2C800%2C468%26w%3D800%26auto%3Dformat&w=256&q=75 256w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F05951a0ec1a6ffc54f615ab160649e92fea982d0-800x764.png%3Frect%3D0%2C0%2C800%2C468%26w%3D800%26auto%3Dformat&w=384&q=75 384w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F05951a0ec1a6ffc54f615ab160649e92fea982d0-800x764.png%3Frect%3D0%2C0%2C800%2C468%26w%3D800%26auto%3Dformat&w=640&q=75 640w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F05951a0ec1a6ffc54f615ab160649e92fea982d0-800x764.png%3Frect%3D0%2C0%2C800%2C468%26w%3D800%26auto%3Dformat&w=750&q=75 750w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F05951a0ec1a6ffc54f615ab160649e92fea982d0-800x764.png%3Frect%3D0%2C0%2C800%2C468%26w%3D800%26auto%3Dformat&w=828&q=75 828w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F05951a0ec1a6ffc54f615ab160649e92fea982d0-800x764.png%3Frect%3D0%2C0%2C800%2C468%26w%3D800%26auto%3Dformat&w=1080&q=75 1080w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F05951a0ec1a6ffc54f615ab160649e92fea982d0-800x764.png%3Frect%3D0%2C0%2C800%2C468%26w%3D800%26auto%3Dformat&w=1200&q=75 1200w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F05951a0ec1a6ffc54f615ab160649e92fea982d0-800x764.png%3Frect%3D0%2C0%2C800%2C468%26w%3D800%26auto%3Dformat&w=1920&q=75 1920w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F05951a0ec1a6ffc54f615ab160649e92fea982d0-800x764.png%3Frect%3D0%2C0%2C800%2C468%26w%3D800%26auto%3Dformat&w=2048&q=75 2048w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F05951a0ec1a6ffc54f615ab160649e92fea982d0-800x764.png%3Frect%3D0%2C0%2C800%2C468%26w%3D800%26auto%3Dformat&w=3840&q=75 3840w"
                        src="/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F05951a0ec1a6ffc54f615ab160649e92fea982d0-800x764.png%3Frect%3D0%2C0%2C800%2C468%26w%3D800%26auto%3Dformat&w=3840&q=75"
                    />
                </a>
            </div>
            <div className="">
                <div>
                    <div className="flex gap-3">
                        <a href="/category/technology">
                            <span className="inline-block text-xs font-medium tracking-wider uppercase   mt-5 text-blue-600">
                                Technology
                            </span>
                        </a>
                    </div>
                    <h2 className="text-lg font-semibold leading-snug tracking-tight mt-2">
                        <a href="/post/architectural-engineering-wonders-of-the-modern-era-for-your-inspiration">
                            <span className="bg-gradient-to-r from-green-200 to-green-100 bg-[length:0px_10px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 hover:bg-[length:100%_3px] group-hover:bg-[length:100%_10px]">
                                Title
                            </span>
                        </a>
                    </h2>
                    <div className="hidden">
                        <p className="mt-2 line-clamp-3 text-sm text-gray-500">
                            <a href="/post/architectural-engineering-wonders-of-the-modern-era-for-your-inspiration">
                                Reinvention often comes in spurts, after a long period of
                                silence. Just as modern architecture recently enjoyed a
                                comeback, brand architecture, a field with well-established
                                principles for decades
                            </a>
                        </p>
                    </div>
                    <div className="mt-3 flex items-center space-x-3 text-gray-500">
                        <a href="/author/mario-sanchez">
                            <div className="flex items-center gap-3">
                                <div className="relative h-5 w-5 flex-shrink-0">
                                    <img
                                        alt="Mario Sanchez"
                                        loading="lazy"
                                        decoding="async"
                                        data-nimg="fill"
                                        className="rounded-full object-cover"
                                        style={{
                                            position: "absolute",
                                            height: "100%",
                                            width: "100%",
                                            left: 0,
                                            top: 0,
                                            right: 0,
                                            bottom: 0,
                                            color: "transparent"
                                        }}
                                        sizes="20px"
                                        srcSet="/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=16&q=75 16w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=32&q=75 32w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=48&q=75 48w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=64&q=75 64w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=96&q=75 96w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=128&q=75 128w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=256&q=75 256w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=384&q=75 384w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=640&q=75 640w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=750&q=75 750w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=828&q=75 828w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=1080&q=75 1080w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=1200&q=75 1200w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=1920&q=75 1920w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=2048&q=75 2048w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=3840&q=75 3840w"
                                        src="/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=3840&q=75"
                                    />
                                </div>
                                <span className="truncate text-sm">Mario Sanchez</span>
                            </div>
                        </a>
                        <span className="text-xs text-gray-300">
                            •
                        </span>
                        <time
                            className="truncate text-sm"
                            dateTime="2022-10-21T15:48:00.000Z"
                        >
                            October 21, 2022
                        </time>
                    </div>
                </div>
            </div>
        </div>
        );
    }

    let from = 0;
    let to = params.count;

    if (params.offset) {
        from = params.offset;
        to = params.offset + params.count;
    }

    return (
        <>
            {articles.slice(from, to).map((article) => (

                <div className="group cursor-pointer">
                    <div className=" overflow-hidden rounded-md bg-gray-100 transition-all hover:scale-105">
                        <a
                            className={`relative block ${params.size === "small" ? "aspect-square" : "aspect-video"}`}
                            href={article.path}
                        >
                            <img
                                alt="Thumbnail"
                                fetchpriority="high"
                                decoding="async"
                                data-nimg="fill"
                                className="object-cover transition-all"
                                style={{
                                    position: "absolute",
                                    height: "100%",
                                    width: "100%",
                                    inset: 0,
                                    color: "transparent"
                                }}
                                sizes="(max-width: 768px) 30vw, 33vw"
                                src={article.img}
                            />
                        </a>
                    </div>
                    <div className="">
                        <div>
                            <div className="flex gap-3">
                                <a href="/category/technology">
                                    <span className="inline-block text-xs font-medium tracking-wider uppercase   mt-5 text-blue-600">
                                        Technology
                                    </span>
                                </a>
                            </div>
                            <h2 className="text-lg font-semibold leading-snug tracking-tight mt-2">
                                <a href={article.path}>
                                    <span className="bg-gradient-to-r from-green-200 to-green-100 bg-[length:0px_10px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 hover:bg-[length:100%_3px] group-hover:bg-[length:100%_10px]">
                                        {article.title}
                                    </span>
                                </a>
                            </h2>
                            <div className="hidden">
                                <p className="mt-2 line-clamp-3 text-sm text-gray-500">
                                    <a href={article.path}>
                                        Reinvention often comes in spurts, after a long period of
                                        silence. Just as modern architecture recently enjoyed a
                                        comeback, brand architecture, a field with well-established
                                        principles for decades
                                    </a>
                                </p>
                            </div>
                            <div className="mt-3 flex items-center space-x-3 text-gray-500">
                                <a href="/author/mario-sanchez">
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-5 w-5 flex-shrink-0">
                                            <img
                                                alt="Mario Sanchez"
                                                loading="lazy"
                                                decoding="async"
                                                data-nimg="fill"
                                                className="rounded-full object-cover"
                                                style={{
                                                    position: "absolute",
                                                    height: "100%",
                                                    width: "100%",
                                                    left: 0,
                                                    top: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    color: "transparent"
                                                }}
                                                sizes="20px"
                                                srcSet="/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=16&q=75 16w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=32&q=75 32w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=48&q=75 48w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=64&q=75 64w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=96&q=75 96w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=128&q=75 128w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=256&q=75 256w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=384&q=75 384w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=640&q=75 640w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=750&q=75 750w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=828&q=75 828w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=1080&q=75 1080w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=1200&q=75 1200w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=1920&q=75 1920w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=2048&q=75 2048w, /_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=3840&q=75 3840w"
                                                src="/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcijrdavx%2Fproduction%2F4a21e3f085ed310d00fbbd294eb2392cde7f9acc-3648x3648.jpg%3Fw%3D2000%26auto%3Dformat&w=3840&q=75"
                                            />
                                        </div>
                                        <span className="truncate text-sm">Mario Sanchez</span>
                                    </div>
                                </a>
                                <span className="text-xs text-gray-300">
                                    •
                                </span>
                                <time
                                    className="truncate text-sm"
                                    dateTime="2022-10-21T15:48:00.000Z"
                                >
                                    October 21, 2022
                                </time>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    )
} 