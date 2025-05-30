import { query } from "firebase/database";
import {
	addCourse,
	addReviewForCourse,
	getReviewsForCourse,
	uploadDepartmentsAndLocations,
} from "../firebase";

export const model = {
	user: undefined,
	//add searchChange: false,   //this is for reworking the searchbar presenter, so that it triggers as a model,
	//instead of passing searchcouses lambda function down into the searchbarview.
	/* courses returned from SearchbarPresenter (search is applied on top of filteredCourses[]) to be shown in the ListView */
	currentSearch: [],

	sidebarIsOpen: true,
	/* current query text */
	currentSearchText: "",
	scrollPosition: 0,
	/* list of all course objects downloaded from the Firebase realtime database and stored locally as JSON object in this array */
	courses: [],
	departments: [],
	locations: [],
	// indexes: 0 -> overall rating; 1 -> difficulty; 2->teacher rating
	avgRatings: [],
	// model.avgRatings["IK1203"][0]
	/* courses the user selected as their favourite */
	favourites: [],
	searchHistory: [],
	isReady: false,
	/* this is a boolean flag showing that filtering options in the UI have changed, triggering the FilterPresenter to recalculate the filteredCourses[] */
	filtersChange: false,
	/* this is a flag showing if the filteredCourses[] has changed (since FilterPresenter recalculated it), so now SearchBarPresenter needs to 
    recalculate currentSearch[] depending this updated list of courses */
	filtersCalculated: false,
	/* this is the array that FilterPresenter fills up with course objects, filtered from the model.courses[] */
	filteredCourses: [],
	/* JSON object containing all important parameters the FilterPresenter needs to calculate the filtered list of courses */
	filterOptions: {
		//apply-X-Filter boolean triggering flag wether corresponding filtering functions should run or not
		//different arrays require different data, some uses string arrays, some boolean values, and so on
		applyTranscriptFilter: false,
		eligibility: "weak", //the possible values for the string are: "weak"/"moderate"/"strong"
		applyLevelFilter: false,
		level: ["PREPARATORY", "BASIC", "ADVANCED", "RESEARCH"], //the possible values for the array are: "PREPARATORY", "BASIC", "ADVANCED", "RESEARCH"
		applyLanguageFilter: false,
		language: "none", //the possible values for the string are: "none"/"english"/"swedish"/"both"
		applyLocationFilter: false,
		location: [], //the possible values for the array are: 'KTH Campus', 'KTH Kista', 'AlbaNova', 'KTH Flemingsberg', 'KTH Solna', 'KTH Södertälje', 'Handelshögskolan', 'KI Solna', 'Stockholms universitet', 'KONSTFACK'
		applyCreditsFilter: false,
		creditMin: 0,
		creditMax: 45,
		applyDepartmentFilter: false,
		department: [],
		applyRemoveNullCourses: false,
		period: [true, true, true, true],
		applyPeriodFilter: false,
	},
	isPopupOpen: false,
	selectedCourse: null,
	searchQueryModel: "",
	isReady: false,
	_coursesListeners: [], //  internal list of listeners

	setReady() {
		this.isReady = true;
	},
	onCoursesSet(callback) {
		this._coursesListeners.push(callback);
	},

	_coursesListeners: [], //  internal list of listeners
	urlStackPointer: 0,

	onCoursesSet(callback) {
		this._coursesListeners.push(callback);
	},

	setUser(user) {
		if (!this.user) this.user = user;
	},

	setCurrentSearch(searchResults) {
		this.currentSearch = searchResults;
	},

	setCurrentSearchText(text) {
		this.currentSearchText = text;
	},

	setScrollPosition(position) {
		this.scrollPosition = position;
	},

	setCourses(courses) {
		this.courses = courses;
		this._coursesListeners.forEach((cb) => cb(courses));
	},

	async addCourse(course) {
		try {
			await addCourse(course);
			this.courses = [...this.courses, course];
		} catch (error) {
			console.error("Error adding course:", error);
		}
	},
	addHistoryItem(course_id) {
		try {
			this.searchHistory = [...this.searchHistory, course_id];
		} catch (error) {
			console.error("Error adding course code to the history:", error);
		}
	},
	setDepartments(departments) {
		this.departments = departments;
	},
	setLocations(locations) {
		this.locations = locations;
	},
	setAverageRatings(ratings) {
		this.avgRatings = ratings;
	},
	updateAverageRating(courseCode, rating) {
		if (this.avgRatings != null) this.avgRatings[courseCode] = rating;
	},
	setFavourite(favorites) {
		this.favourites = favorites;
	},

	addFavourite(course) {
		this.favourites = [...this.favourites, course];
	},

	removeFavourite(course) {
		this.favourites = (this.favourites || []).filter(
			(fav) => fav.code !== course.code
		);
	},

	getCourse(courseID) {
		return this.courses.find((course) => course.code === courseID);
	},

	getCourseNames(courseID_array) {
		let return_obj = {};
		for (let course of this.courses) {
			if (courseID_array.includes(course.code)) {
				return_obj[course.code] = course.name;
			}
		}
		return return_obj;
	},

	populateDatabase(data) {
		if (!data || !this) {
			console.log("no model or data");
			return;
		}
		const dep = new Set();
		const loc = new Set();
		const entries = Object.entries(data);
		entries.forEach((entry) => {
			const course = {
				code: entry[1].code,
				name: entry[1]?.name ?? null,
				location: entry[1]?.location ?? null,
				department: entry[1]?.department ?? null,
				language: entry[1]?.language ?? null,
				description: entry[1]?.description ?? null,
				academicLevel: entry[1]?.academic_level ?? null,
				periods: entry[1]?.periods ?? null,
				credits: entry[1]?.credits ?? 0,
				prerequisites: entry[1]?.prerequisites ?? null,
				prerequisites_text: entry[1]?.prerequisites_text ?? null,
				learning_outcomes: entry[1]?.learning_outcomes ?? null,
			};
			this.addCourse(course);
			dep.add(course.department);
			loc.add(course.location);
		});
		this.departments = Array.from(dep);
		this.locations = Array.from(loc);
		uploadDepartmentsAndLocations(this.departments, this.locations);
	},
	//for reviews
	async addReview(courseCode, review) {
		try {
			await addReviewForCourse(courseCode, review);
			return true;
		} catch (error) {
			console.error("Error adding review:", error);
			return false;
		}
	},

	async getReviews(courseCode) {
		try {
			const rawReviews = await getReviewsForCourse(courseCode);
            if (!Array.isArray(rawReviews)) return [];
    
            const enriched = rawReviews.map((review) => {
                return {
                    ...review,
                    uid: review.uid || review.id || "",       
                    courseCode: courseCode || "",             
                };
            });
    
            return enriched;
		} catch (error) {
			console.error("Error fetching reviews:", error);
			return [];
		}
	},

	//for filters

	setFiltersChange() {
		this.filtersChange = true;
	},

	setFiltersCalculated() {
		this.filtersCalculated = true;
	},

	setFilterOptions(options) {
		this.filterOptions = options; // do we want to set the flags? What about useEffect?
	},

	setApplyRemoveNullCourses() {
		this.filterOptions.applyRemoveNullCourses = !this.filterOptions
			.applyRemoveNullCourses;
		this.setFiltersChange();
	},

	setApplyRemoveNullCourses() {
		this.filterOptions.applyRemoveNullCourses = !this.filterOptions
			.applyRemoveNullCourses;
		this.setFiltersChange();
	},

	updateLevelFilter(level) {
		this.filterOptions.level = level;
	},

	updateDepartmentFilter(department) {
		this.filterOptions.department = department;
	},

	updateLanguageFilter(languages) {
		this.filterOptions.language = languages;
	},
	updateLocationFilter(location) {
		this.filterOptions.location = location;
	},
	updateCreditsFilter(creditLimits) {
		this.filterOptions.creditMin = creditLimits[0];
		this.filterOptions.creditMax = creditLimits[1];
	},
	updateTranscriptElegibilityFilter(eligibility) {
		this.filterOptions.eligibility = eligibility;
	},

	updateDepartmentFilter(department) {
		this.filterOptions.department = department;
	},

	updatePeriodFilter(period) {
		this.filterOptions.period = period;
	},

	setApplyTranscriptFilter(transcriptFilterState) {
		this.filterOptions.applyTranscriptFilter = transcriptFilterState;
	},
	setApplyLevelFilter(levelFilterState) {
		this.filterOptions.applyLevelFilter = levelFilterState;
	},
	setApplyLanguageFilter(languageFilterState) {
		this.filterOptions.applyLanguageFilter = languageFilterState;
	},
	setApplyLocationFilter(locationFilterState) {
		this.filterOptions.applyLocationFilter = locationFilterState;
	},
	setApplyCreditsFilter(creditsFilterState) {
		this.filterOptions.applyCreditsFilter = creditsFilterState;
	},
	setApplyDepartmentFilter(departmentFilterState) {
		this.filterOptions.applyDepartmentFilter = departmentFilterState;
	},
	setApplyPeriodFilter(periodfilterState) {
		this.filterOptions.applyPeriodFilter = periodfilterState;
	},
	//for better display we would like the departments in a structured format based on school
	formatDepartments() {
		const grouped = this?.departments.reduce((acc, item) => {
			const [school, department] = item.split("/");
			if (!acc[school]) {
				acc[school] = [];
			}
			acc[school].push(department?.trim());
			return acc;
		}, {});
		const sortedGrouped = Object.keys(grouped)
			.sort()
			.reduce((acc, key) => {
				acc[key] = grouped[key].sort();
				return acc;
			}, {});
		const fields = Object.entries(sortedGrouped).map(
			([school, departments], index) => ({
				id: index + 1,
				label: school,
				subItems: departments,
			})
		);
		return fields;
	},
	async getAverageRating(courseCode, option) {
		const reviews = await getReviewsForCourse(courseCode);
		if (!reviews || reviews.length === 0) return null;

		let validReviews = 0;
		let total = 0;

		switch (option) {
			case "avg":
				reviews.forEach((review) => {
					if (typeof review.overallRating === "number") {
						total += review.overallRating;
						validReviews++;
					}
				});
				break;
			case "diff":
				reviews.forEach((review) => {
					if (typeof review.difficultyRating === "number") {
						total += review.difficultyRating;
						validReviews++;
					}
				});
				break;
			case "prof":
				reviews.forEach((review) => {
					if (typeof review.professorRating === "number") {
						total += review.professorRating;
						validReviews++;
					}
				});
				break;
			default:
				return null;
		}

		if (validReviews === 0) return null;
		return (total / validReviews).toFixed(1);
	},

	setPopupOpen(isOpen) {
		if (!isOpen) {
			let current_url = window.location.href;
			let end_index = indexOfNth(current_url, "/", 3);
			if (end_index + 1 != current_url.length) {
				window.history.back();
			}
		}

		this.isPopupOpen = isOpen;
	},

	setSelectedCourse(course) {
		this.selectedCourse = course;
	},

	toggleSidebarIsOpen() {
		this.sidebarIsOpen = !this.sidebarIsOpen;
	},

	handleUrlChange() {
		let current_url = window.location.href;

		let start_idx = indexOfNth(current_url, "/", 3) + 2;

		if (start_idx > 0 && start_idx < current_url.length) {
			let course_code = current_url.slice(start_idx);
			let course = this.getCourse(course_code);
			if (course) {
				this.setSelectedCourse(course);
				this.setPopupOpen(true);
			}
			this.urlStackPointer++;
		} else if (start_idx > 0) {
			this.setPopupOpen(false);
		}
	},
};

function indexOfNth(string, char, n) {
	let count = 0;
	for (let i = 0; i < string.length; i++) {
		if (string[i] == char) {
			count++;
		}
		if (count == n) {
			return i;
		}
	}
	return -1;
}
