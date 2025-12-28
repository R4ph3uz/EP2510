// Centers the map on the user's location
import {
    AlertDialogContent, 
    AlertDialog, 
    AlertDialogTrigger, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogDescription, 
    AlertDialogFooter,
    AlertDialogCancel} from "@/components/ui/alert-dialog";
import {Button} from "@/components/ui/button.jsx"

export function Info() {

    return(
        <AlertDialog className="z-500">
            <AlertDialogTrigger className={"cursor-pointer"} asChild>
                <Button className={"border cursor-pointer"}>View More</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>I am happy to share with you this new tool</AlertDialogTitle>
                <AlertDialogDescription>
                    The goal of the project is to visualize whether using an approximate location is a good idea from both a privacy and usability perspective.
                    Approximate location was implemented in Android 12 (2022) and consist of placing a new point on a grid, or setting a radius and putting a random location inn this circle.
                    The goal of this WebApp is to visualize the path from where you are, where you want to go and vary the radius of approximate location to see the impact on formulas. 
                </AlertDialogDescription>
                <AlertDialogTitle>Formulas of privacy and usefullness are set to :</AlertDialogTitle>
                <AlertDialogDescription>
                        <li className="ml-4"><span className="font-bold">privacy % = 1 - exp(-radius*d(A,B))</span> where d is the haversine distance</li>
                        <li className="ml-4"><span className="font-bold">usefullness % = length_shared_path(A,B,C) / length_total_path(A,C)</span> where length_shared_path represent the length of the shared path between (A,C) and (B,C)</li>
                </AlertDialogDescription>
                <AlertDialogTitle>EP2510 - Advanced Network Security</AlertDialogTitle>
                <AlertDialogDescription>
                    This project was completed as part of the EP2510 - Advanced Network Security course at KTH. 
                    Thanks to Professor Panagiotis Papadimitratos and Doctoral Student Zahra Alimadadi for their help.
                    You can find <a href="#" className="text-blue-400 underline">here</a> the paper I wrote on it.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    );
}
