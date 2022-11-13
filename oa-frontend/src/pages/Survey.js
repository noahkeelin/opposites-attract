import React, { useEffect, useRef, useState } from 'react'
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import { FaFire, FaPizzaSlice, FaThermometer } from "react-icons/fa";

import { useAuth } from '../components/Auth';
import clsx from 'clsx';
import Button from '../components/Buttons';
import { useNavigate } from 'react-router';

const surveyInfo = [
    {
        icon: FaPizzaSlice,
        title: "pineapple on pizza?",
        subtitle: "asking the real questions first",
        options: [
            "yum yum",
            "no thanks"
        ],
        key: 'pineapple'
    },
    {
        icon: FaThermometer,
        title: "hot or cold?",
        subtitle: "coffee, soup temp, room, blizzard, ice cream, water, etc",
        options: [
            "hot",
            "cold"
        ],
        key: 'temp'
    },
    {
        icon: MdPets,
        title: "cats or dogs?",
        subtitle: "oldie but goodie",
        options: [
            "meow",
            "a long nosed thing"
        ],
        key: 'pets'
    },
    {
        icon: SlPeople,
        title: "introvert or extrover?",
        subtitle: "meyer's briggs told me i should go into entertainment, hbu?",
        options: [
            "ew people",
            "people"
        ]
    },
    {
        icon: GiSeaCreature,
        title: "loch-ness monster?",
        subtitle: "is nessie just a friend in my imagination?",
        options: [
            "yes i love nessie too",
            "you are crazy"
        ]
    },
    {
        icon: GiMilkCarton,
        title: "milk",
        subtitle: "drink milk?",
        options: [
            "it's creamy goodness",
            "who wants utter juice"
        ]
    },
    {
       icon: TbFriendsOff,
       title: "exes",
       subtitle: "could you be friends?",
       options: [
            "yes",
            "no"
       ]
    }

];

const timeToString = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secondsLeft = seconds % 60;
    return `${minutes}:${secondsLeft < 10 ? '0' : ''}${secondsLeft}`;
}

export default function Survey() {
    const [surveyData, setSurveyData] = useState(null);
    const [surveyProg, setSurveyProg] = useState(-1);
    const { apiGet, apiPost, loggedIn } = useAuth();
    const navigate = useNavigate();

    const loadSurvey = async () => {
        const { status, survey, prog } = await apiGet("/user/surveyProgress");
        if (status == 200) {
            setSurveyData(survey);
            setSurveyProg(prog);
        }
    }

    const [sending, setSending] = useState(false);
    const sendSurvey = async () => {
        setSending(true);
        const { status } = await apiPost("/user/survey", { surveyData });
        if (status == 200) {
            setSending(false);
        }
    }

    const contentRef = useRef(null);
    useEffect(() => {
        if (loggedIn) {
            const timeout = setTimeout(loadSurvey, 100);
            return () => clearTimeout(timeout);
        }
    }, [loggedIn]);

    const [showTimer, setShowTimer] = useState(false);
    const [timer, setTimer] = useState(0);
    useEffect(() => {
        if (surveyProg === surveyInfo.length) {
            setShowTimer(false);
            sendSurvey();
        }
        else if (surveyProg > -1) {
            const timeout = setTimeout(() => {
                setShowTimer(true);
                setTimer(1000);
            }, 500);
            return () => clearTimeout(timeout);
        }
        else setShowTimer(false);
    }, [surveyProg]);

    useEffect(() => {
        if (showTimer) {
            const interval = setInterval(() => {
                setTimer(timer => {
                    if (timer > 0) return timer - 1;
                    setSurveyProg((prev) => prev + 1);
                    setShowTimer(false);
                    clearInterval(interval);
                    return 0;
                });
            }, 500);
            return () => clearInterval(interval);
        }
    }, [showTimer, timer]);

    let content = null;
    if (surveyInfo[surveyProg]) {
        const IconComponent = surveyInfo[surveyProg].icon;
        const dataKey = surveyInfo[surveyProg].key;

        content = <>
            <IconComponent size={36} className="mb-2" />
            <h1 className='text-2xl font-bold'>{surveyInfo[surveyProg].title}</h1>
            <p className='text-md'>{surveyInfo[surveyProg].subtitle}</p>
            {(surveyInfo[surveyProg].options || []).map((option, i) => {
                const color = i % 2 ? 'bg-blue-500' : 'bg-red-500';
                const outline = i % 2 ? 'border-blue-500' : 'border-red-500';
                return <button key={i} className={clsx('flex items-center text-center mb-2',
                    {
                        'mt-3': i === 0,
                    })}
                    onClick={
                        () => setSurveyData((prev) => ({
                            ...prev,
                            [dataKey]: i
                        }))
                    }
                >
                    <div className={
                        clsx('flex rounded-full bg-gray-200 border-2 h-8 w-8 mr-2',
                            {
                                [outline]: surveyData[dataKey] === i,
                            }
                        )
                    }
                    >
                        {surveyData[dataKey] === i && <div className={`rounded-full ${color} h-4 w-4 m-auto`} />}
                    </div>
                    {option}
                </button>
            })
            }

            <div className='flex justify-between w-full h-6'>
                {surveyProg > 0 ? <button onClick={
                    () => setSurveyProg((prev) => prev - 1)
                }>
                    Back
                </button>
                    : <div />}
                {dataKey in surveyData && <button
                    onClick={
                        () => setSurveyProg((prev) => prev + 1)
                    }
                >
                    Next
                </button>}
            </div>
        </>
    }
    else if (surveyProg === surveyInfo.length) {
        content = <>
            <FaFire size={36} className="mb-2" />
            <h1 className='text-2xl font-bold'>You're all done!</h1>
            <p className='text-md'>Thanks for taking the time to fill out the survey.</p>
            {
                sending ? <div>
                    <p className='text-md'>Sending your data...</p>
                </div>
                    : <div className='mt-4 flex flex-col items-center w-full justify-between'>
                        <Button onClick={() => navigate("/dashboard")}>view your matches</Button>
                        <Button isRed onClick={() => setSurveyProg(0)} className="mt-3">take it again</Button>
                    </div>
            }
        </>
    }

    return (
        <div className='w-full flex justify-center items-center min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-indigo-500 via-pink-400 to-orange-500 relative'>
            {content && <SwitchTransition mode="out-in">
                <CSSTransition
                    key={surveyProg.toString()}
                    nodeRef={contentRef}
                    timeout={300}
                    classNames="page"
                    unmountOnExit
                >
                    <div className='flex h-fit w-[22rem] relative'>
                        <div className={clsx(
                            "absolute right-0 top-0 bg-gradient-to-t from-red-600 to-red-500 rounded-t-2xl py-1 px-2 pb-8 text-white font-bold text-4xl shadow-lg duration-[3s] transition-all",
                            {
                                "top-[-3.5rem]": showTimer,
                            })
                        }>
                            {timeToString(timer)}
                        </div>
                        <div className='flex flex-col w-full bg-white p-8 rounded-2xl shadow-md relative'>
                            {content}
                        </div>
                    </div>
                </CSSTransition>
            </SwitchTransition>}
        </div >
    )
}
