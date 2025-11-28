"use client";

import GoogleLoginButton from "@/components/buttons/google-login";
import Logo from "@/components/logo/logo";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { motion } from "motion/react"
import { signInWithGoogle } from "./sign-in/actions";
import { useEffect, useState } from "react";
import { createClient } from "@/scripts/supabase/client";
import { toast, Toaster } from "sonner";
import { Card, Carousel } from "@/components/ui/apple-cards-carousel";
import { useRouter } from "next/navigation";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const supabase = createClient();

      const metadata = await supabase.auth.getUser();

      setIsAuthenticated(!!metadata.data.user);
      console.log(metadata.data.user);
    })();
  }, []);

  function handleTry() {
    toast('Пожалуйста, подождите...', { position: 'top-center'});

    router.push('/dashboard/chat');
  }

  // const cards = data.map((card, index) => (
  //   <Card key={card.src} card={card} index={index} />
  // ));

  return (
    <div className="font-sans min-h-screen p-4 pb-20 max-w-2xl mx-auto">
      <Toaster theme="dark" />

      <Logo className="mx-auto"/>

      <div className="h-6"/>
      <span className="text-[#1596FF] font-medium mt-12">Startup Generation</span>
      <h1 className="mt-2 text-2xl font-semibold">Аналитика нового поколения.</h1>

      <div className="rounded-3xl shadow-lg bg-[url('/LandingCardBackground.jpg')] bg-cover bg-center h-48 mt-6 flex items-center justify-center">
        <span className="text-white text-4xl font-semibold tracking-tight">Heylock</span>
      </div>


      <p className="text-muted-foreground font-medium mt-4 text-lg">
        Здесь представлен <span className="text-white">доступ к прототипу</span> нейросети, используемой в Heylock.
        <span className="mt-4 block"/>
        Он использует <span className="text-white">тестовые данные</span>, так что вы уже можете их проанализировать.
      </p>

      <motion.button className="font-medium w-full bg-primary rounded-xl py-3 mt-8" whileTap={{scale: 0.95}} onClick={handleTry}>
        Попробовать
      </motion.button>

      {/* <Carousel items={cards} /> */}
    </div>
  );
}


// const data = [
//   {
//     category: "Экономия времени",
//     title: "Анализ за 5 минут",
//     src: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=3556&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//     content: <div>
//       hi there
//     </div>
//   },
//   {
//     category: "Спасаем стартапы",
//     title: "",
//     src: "https://images.unsplash.com/photo-1531554694128-c4c6665f59c2?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//   },
//   {
//     category: "Product",
//     title: "Launching the new Apple Vision Pro.",
//     src: "https://images.unsplash.com/photo-1713869791518-a770879e60dc?q=80&w=2333&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//   },
//   {
//     category: "Product",
//     title: "Maps for your iPhone 15 Pro Max.",
//     src: "https://images.unsplash.com/photo-1599202860130-f600f4948364?q=80&w=2515&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//   },
//   {
//     category: "iOS",
//     title: "Photography just got better.",
//     src: "https://images.unsplash.com/photo-1602081957921-9137a5d6eaee?q=80&w=2793&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//   },
//   {
//     category: "Hiring",
//     title: "Hiring for a Staff Software Engineer",
//     src: "https://images.unsplash.com/photo-1511984804822-e16ba72f5848?q=80&w=2048&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//   },
// ];


/*
<AlertDialog>
            <AlertDialogTrigger>
              <div className="border border-white/15 rounded-xl py-2 px-4">
                Оповестить о релизе
              </div>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Подписаться на релиз</AlertDialogTitle>
                <AlertDialogDescription>
                  Для этого нужно зарегистрироваться
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="font-normal mt-1">Закрыть</AlertDialogCancel>
                <GoogleLoginButton onClick={handleGoogle}/>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
*/