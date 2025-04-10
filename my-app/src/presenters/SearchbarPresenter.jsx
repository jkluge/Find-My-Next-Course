import React from 'react';
import { observer } from "mobx-react-lite";
import { useState } from 'react';
import CoursePagePopup from '../views/Components/CoursePagePopup.jsx';
import PrerequisitePresenter from './PrerequisitePresenter.jsx';
import { ReviewPresenter } from "../presenters/ReviewPresenter.jsx";
import SearchbarView from "../views/SearchbarView.jsx";

const SearchbarPresenter = observer(({ model }) => {
    const searchCourses = (query) => {
        const searchResults = model.courses.filter(course =>
            course.code.toLowerCase().includes(query.toLowerCase()) ||
            course.name.toLowerCase().includes(query.toLowerCase()) ||
            course.description.toLowerCase().includes(query.toLowerCase())
        );
        model.setCurrentSearch(searchResults);
    };

    const addFavourite = (course) => {
        model.addFavourite(course);
    };

    const removeFavourite = (course) => {
        model.removeFavourite(course);
    };

    const handleFavouriteClick = (course) => {
        if (model.favourites.some(fav => fav.code === course.code)) {
            model.removeFavourite(course);
        } else {
            model.addFavourite(course);
        }
    };

    const creditsSum = (favouriteCourses) => {
        return favouriteCourses.reduce((sum, course) => sum + parseFloat(course.credits), 0);
    };

    function removeAllFavourites() {
        model.setFavourite([]);
    }

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const preP = <PrerequisitePresenter model={model} selectedCourse={selectedCourse} />;
    const reviewPresenter = <ReviewPresenter model={model} course={selectedCourse} />;

    const popup = <CoursePagePopup
        favouriteCourses={model.favourites}
        addFavourite={addFavourite}
        removeFavourite={removeFavourite}
        handleFavouriteClick={handleFavouriteClick}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        course={selectedCourse}
        reviewPresenter={reviewPresenter}
        prerequisiteTree={preP}
    />;

    return (
        <SearchbarView
            model={model}
            searchCourses={searchCourses}
            favouriteCourses={model.favourites}
            removeAllFavourites={removeAllFavourites}
            addFavourite={addFavourite}
            removeFavourite={removeFavourite}
            isPopupOpen={isPopupOpen}
            setIsPopupOpen={setIsPopupOpen}
            setSelectedCourse={setSelectedCourse}
            popup={popup}
            handleFavouriteClick={handleFavouriteClick}
            totalCredits={creditsSum(model.favourites)}
        />
    );
});

export { SearchbarPresenter };
