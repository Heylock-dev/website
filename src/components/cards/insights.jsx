import Image from "next/image";
import { twMerge } from "tailwind-merge";
import LinkIcon from "../../../public/IconLink24.svg";
import Link from "next/link";

const dummyInsights = [
    {
        uuid: 'f6h20986h236ffh',
        title: 'People in the hero section',
        body: 'Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet.',
        created_at: 1760096929749,
        source_url: 'http://localhost/dashboard',
    },
    {
        uuid: 'f6h20986h236f823fh',
        title: 'Bigger title text',
        body: 'Lorem ipsum dolor sit amet.',
        created_at: 1750096929749,
        source_url: 'http://localhost/dashboard',
    },
];

export default function InsightsCard({ className, }){
    return (
        <div className={twMerge("w-full border border-deemphasized-grid-outline rounded-xl", className)}>
            {/* Header */}
            <div className="px-3 py-2.5 flex flex-row justify-between border-b border-deemphasized-grid-outline">
                <h2>Insights</h2>
                <Link href="/dashboard/insights" className="hover:bg-neutral-900 rounded-sm transition-colors duration-150 scale-125">
                    <Image src={LinkIcon} alt="Link" draggable={false}/>
                </Link>
            </div>

            <div className="px-3 pb-6 overflow-y-scroll">
                {
                    dummyInsights.map((data, index) => {
                        return (
                            <div className={`${index === 0 ? 'mt-3' : 'mt-4'}`} key={data.uuid}>
                                <a href={data.source_url} className="hover:underline underline-offset-2 hover:cursor-pointer">{(new Date().getTime() - data.created_at) < (1000 * 3600 * 24) && <span className="font-medium">New |</span>} {data.title}</a>
                                <p className="mt-0.5 text-sm text-deemphasized-text">{data.body}</p>
                            </div>
                        );
                    })
                }
            </div>
        </div>
    );
}